"""
Orchestrates Java static-analysis tooling against a checked-out repo.

Workflow:
  1. Detect build system (Maven vs Gradle) from files on disk.
  2. Run the relevant Checkstyle / PMD / SpotBugs goals for that build
     system as subprocesses.
  3. Parse each tool's XML report into a common, structured finding list.
  4. Return one dict keyed by tool name — this is what gets persisted
     into Review.static_analysis_results (JSONB).

This module only *shells out* to already-installed tooling (mvn/gradle
and their plugins) — it does not implement any static analysis itself.
"""

import asyncio
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field
from pathlib import Path

from app.core.config import settings
from app.models.repo import BuildSystem


@dataclass
class Finding:
    file: str
    line: int | None
    severity: str
    rule: str
    message: str


@dataclass
class ToolResult:
    tool: str
    ran: bool
    findings: list[Finding] = field(default_factory=list)
    error: str | None = None


def detect_build_system(repo_path: Path) -> BuildSystem:
    if (repo_path / "pom.xml").exists():
        return BuildSystem.MAVEN
    if (repo_path / "build.gradle").exists() or (repo_path / "build.gradle.kts").exists():
        return BuildSystem.GRADLE
    return BuildSystem.UNKNOWN


async def _run_command(cmd: list[str], cwd: Path) -> tuple[int, str, str]:
    proc = await asyncio.create_subprocess_exec(
        *cmd,
        cwd=str(cwd),
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    try:
        stdout, stderr = await asyncio.wait_for(
            proc.communicate(), timeout=settings.ANALYSIS_TIMEOUT_SECONDS
        )
    except asyncio.TimeoutError:
        proc.kill()
        raise TimeoutError(f"command timed out after {settings.ANALYSIS_TIMEOUT_SECONDS}s: {' '.join(cmd)}")
    return proc.returncode, stdout.decode(errors="replace"), stderr.decode(errors="replace")


# --- Checkstyle -------------------------------------------------------

def _parse_checkstyle_xml(report_path: Path) -> list[Finding]:
    if not report_path.exists():
        return []
    findings: list[Finding] = []
    root = ET.parse(report_path).getroot()
    for file_el in root.findall("file"):
        filename = file_el.get("name", "")
        for err in file_el.findall("error"):
            findings.append(
                Finding(
                    file=filename,
                    line=int(err.get("line")) if err.get("line") else None,
                    severity=err.get("severity", "info"),
                    rule=err.get("source", "checkstyle"),
                    message=err.get("message", ""),
                )
            )
    return findings


async def run_checkstyle(repo_path: Path, build_system: BuildSystem) -> ToolResult:
    try:
        if build_system == BuildSystem.MAVEN:
            code, _, err = await _run_command(["mvn", "-q", "checkstyle:checkstyle"], repo_path)
            report = repo_path / "target" / "checkstyle-result.xml"
        elif build_system == BuildSystem.GRADLE:
            code, _, err = await _run_command(["./gradlew", "checkstyleMain", "-q"], repo_path)
            report = repo_path / "build" / "reports" / "checkstyle" / "main.xml"
        else:
            return ToolResult(tool="checkstyle", ran=False, error="unsupported build system")

        findings = _parse_checkstyle_xml(report)
        return ToolResult(tool="checkstyle", ran=True, findings=findings, error=err[:500] if code != 0 else None)
    except Exception as exc:
        return ToolResult(tool="checkstyle", ran=False, error=str(exc))


# --- PMD ----------------------------------------------------------------

def _parse_pmd_xml(report_path: Path) -> list[Finding]:
    if not report_path.exists():
        return []
    findings: list[Finding] = []
    root = ET.parse(report_path).getroot()
    ns = {"pmd": "http://pmd.sourceforge.net/report/2.0.0"}
    for file_el in root.findall("pmd:file", ns) or root.findall("file"):
        filename = file_el.get("name", "")
        for viol in file_el.findall("pmd:violation", ns) or file_el.findall("violation"):
            findings.append(
                Finding(
                    file=filename,
                    line=int(viol.get("beginline")) if viol.get("beginline") else None,
                    severity=viol.get("priority", "3"),
                    rule=viol.get("rule", "pmd"),
                    message=(viol.text or "").strip(),
                )
            )
    return findings


async def run_pmd(repo_path: Path, build_system: BuildSystem) -> ToolResult:
    try:
        if build_system == BuildSystem.MAVEN:
            code, _, err = await _run_command(["mvn", "-q", "pmd:pmd"], repo_path)
            report = repo_path / "target" / "pmd.xml"
        elif build_system == BuildSystem.GRADLE:
            code, _, err = await _run_command(["./gradlew", "pmdMain", "-q"], repo_path)
            report = repo_path / "build" / "reports" / "pmd" / "main.xml"
        else:
            return ToolResult(tool="pmd", ran=False, error="unsupported build system")

        findings = _parse_pmd_xml(report)
        return ToolResult(tool="pmd", ran=True, findings=findings, error=err[:500] if code != 0 else None)
    except Exception as exc:
        return ToolResult(tool="pmd", ran=False, error=str(exc))


# --- SpotBugs -------------------------------------------------------------

def _parse_spotbugs_xml(report_path: Path) -> list[Finding]:
    if not report_path.exists():
        return []
    findings: list[Finding] = []
    root = ET.parse(report_path).getroot()
    for bug in root.findall("BugInstance"):
        source_line = bug.find("SourceLine")
        findings.append(
            Finding(
                file=source_line.get("sourcepath", "") if source_line is not None else "",
                line=int(source_line.get("start")) if source_line is not None and source_line.get("start") else None,
                severity=bug.get("priority", "3"),
                rule=bug.get("type", "spotbugs"),
                message=(bug.find("LongMessage").text if bug.find("LongMessage") is not None else ""),
            )
        )
    return findings


async def run_spotbugs(repo_path: Path, build_system: BuildSystem) -> ToolResult:
    try:
        if build_system == BuildSystem.MAVEN:
            code, _, err = await _run_command(["mvn", "-q", "com.github.spotbugs:spotbugs-maven-plugin:check"], repo_path)
            report = repo_path / "target" / "spotbugsXml.xml"
        elif build_system == BuildSystem.GRADLE:
            code, _, err = await _run_command(["./gradlew", "spotbugsMain", "-q"], repo_path)
            report = repo_path / "build" / "reports" / "spotbugs" / "main.xml"
        else:
            return ToolResult(tool="spotbugs", ran=False, error="unsupported build system")

        findings = _parse_spotbugs_xml(report)
        return ToolResult(tool="spotbugs", ran=True, findings=findings, error=err[:500] if code != 0 else None)
    except Exception as exc:
        return ToolResult(tool="spotbugs", ran=False, error=str(exc))


# --- Orchestration ---------------------------------------------------------

async def run_java_static_analysis(repo_path: Path) -> dict:
    """
    Entry point used by the review pipeline: detects the build system
    once, then runs all three tools concurrently against the checkout.
    """
    build_system = detect_build_system(repo_path)
    if build_system == BuildSystem.UNKNOWN:
        return {
            "build_system": "unknown",
            "tools": {},
            "note": "no pom.xml or build.gradle found — skipping Java static analysis",
        }

    checkstyle, pmd, spotbugs = await asyncio.gather(
        run_checkstyle(repo_path, build_system),
        run_pmd(repo_path, build_system),
        run_spotbugs(repo_path, build_system),
    )

    def _serialize(result: ToolResult) -> dict:
        return {
            "ran": result.ran,
            "error": result.error,
            "finding_count": len(result.findings),
            "findings": [f.__dict__ for f in result.findings],
        }

    return {
        "build_system": build_system.value,
        "tools": {
            "checkstyle": _serialize(checkstyle),
            "pmd": _serialize(pmd),
            "spotbugs": _serialize(spotbugs),
        },
    }
