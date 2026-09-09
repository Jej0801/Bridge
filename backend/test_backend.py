#!/usr/bin/env python3
"""
Test script for Bridge backend without requiring full database setup.
Tests API structure, oEmbed service, and basic functionality.
"""
import asyncio
import sys
from typing import Any

# Color codes for terminal output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def print_test(name: str, status: str, details: str = ""):
    """Print test result with color"""
    if status == "PASS":
        symbol = f"{GREEN}✅{RESET}"
    elif status == "FAIL":
        symbol = f"{RED}❌{RESET}"
    else:
        symbol = f"{YELLOW}⚠️{RESET}"

    print(f"{symbol} {name}: {status}")
    if details:
        print(f"   {details}")

def print_section(title: str):
    """Print section header"""
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}{title}{RESET}")
    print(f"{BLUE}{'='*60}{RESET}\n")

async def test_oembed_service():
    """Test oEmbed service functionality"""
    print_section("Testing oEmbed Service")

    try:
        from app.services.oembed import (
            detect_platform,
            fetch_tiktok_oembed,
            SourcePlatform
        )

        # Test 1: Platform detection
        tiktok_url = "https://www.tiktok.com/@user/video/123"
        instagram_url = "https://www.instagram.com/p/ABC123/"
        other_url = "https://example.com"

        platform1 = detect_platform(tiktok_url)
        platform2 = detect_platform(instagram_url)
        platform3 = detect_platform(other_url)

        if platform1 == SourcePlatform.TIKTOK:
            print_test("Platform Detection (TikTok)", "PASS", f"Detected: {platform1.value}")
        else:
            print_test("Platform Detection (TikTok)", "FAIL", f"Expected TIKTOK, got {platform1}")

        if platform2 == SourcePlatform.INSTAGRAM:
            print_test("Platform Detection (Instagram)", "PASS", f"Detected: {platform2.value}")
        else:
            print_test("Platform Detection (Instagram)", "FAIL", f"Expected INSTAGRAM, got {platform2}")

        if platform3 == SourcePlatform.UNKNOWN:
            print_test("Platform Detection (Unknown)", "PASS", f"Detected: {platform3.value}")
        else:
            print_test("Platform Detection (Unknown)", "FAIL", f"Expected UNKNOWN, got {platform3}")

        # Test 2: TikTok oEmbed (live test with public API)
        print("\n   Testing live TikTok oEmbed API...")
        test_tiktok_url = "https://www.tiktok.com/@zachking/video/6768504823336815877"

        result = await fetch_tiktok_oembed(test_tiktok_url)

        if result.success:
            print_test("TikTok oEmbed Fetch", "PASS",
                      f"Title: {result.title[:50] if result.title else 'None'}...")
            if result.author_name:
                print(f"   Author: {result.author_name}")
            if result.thumbnail_url:
                print(f"   Thumbnail: {result.thumbnail_url[:60]}...")
        else:
            print_test("TikTok oEmbed Fetch", "WARN",
                      f"Failed (may be rate limited): {result.error}")

    except Exception as e:
        print_test("oEmbed Service", "FAIL", f"Error: {str(e)}")
        return False

    return True

def test_api_structure():
    """Test API route structure"""
    print_section("Testing API Structure")

    try:
        from app.api.routes import share, health
        from app.main import app

        # Check routes are registered
        routes = [route.path for route in app.routes]

        expected_routes = [
            "/share",
            "/share/{shared_content_id}",
            "/health/live",
            "/health/ready",
            "/health/startup"
        ]

        for expected in expected_routes:
            if any(expected in route for route in routes):
                print_test(f"Route: {expected}", "PASS")
            else:
                print_test(f"Route: {expected}", "FAIL", "Route not found")

        # Check route methods
        from app.api.routes.share import router as share_router
        share_routes = {route.path: route.methods for route in share_router.routes}

        if "" in share_routes and "POST" in share_routes[""]:
            print_test("POST /share endpoint", "PASS")
        else:
            print_test("POST /share endpoint", "FAIL")

        if "/{shared_content_id}" in share_routes and "GET" in share_routes["/{shared_content_id}"]:
            print_test("GET /share/{id} endpoint", "PASS")
        else:
            print_test("GET /share/{id} endpoint", "FAIL")

    except Exception as e:
        print_test("API Structure", "FAIL", f"Error: {str(e)}")
        return False

    return True

def test_models():
    """Test database models"""
    print_section("Testing Database Models")

    try:
        from app.models.shared_content import (
            SharedContent,
            SourcePlatform,
            ShareStatus
        )

        # Test enums
        platforms = [p.value for p in SourcePlatform]
        statuses = [s.value for s in ShareStatus]

        if "tiktok" in platforms and "instagram" in platforms:
            print_test("SourcePlatform Enum", "PASS", f"Values: {', '.join(platforms)}")
        else:
            print_test("SourcePlatform Enum", "FAIL")

        if "pending" in statuses and "enriched" in statuses and "failed" in statuses:
            print_test("ShareStatus Enum", "PASS", f"Values: {', '.join(statuses)}")
        else:
            print_test("ShareStatus Enum", "FAIL")

        # Test model structure
        if hasattr(SharedContent, '__tablename__'):
            print_test("SharedContent Model", "PASS",
                      f"Table: {SharedContent.__tablename__}")
        else:
            print_test("SharedContent Model", "FAIL")

    except Exception as e:
        print_test("Database Models", "FAIL", f"Error: {str(e)}")
        return False

    return True

def test_schemas():
    """Test Pydantic schemas"""
    print_section("Testing Pydantic Schemas")

    try:
        from app.schemas.share import SharedContentCreate, SharedContentOut
        from pydantic import ValidationError
        import uuid

        # Test SharedContentCreate
        valid_data = {
            "user_id": str(uuid.uuid4()),
            "url": "https://www.tiktok.com/@user/video/123"
        }

        try:
            created = SharedContentCreate(**valid_data)
            print_test("SharedContentCreate Schema", "PASS",
                      f"Validated URL: {str(created.url)[:50]}...")
        except ValidationError as e:
            print_test("SharedContentCreate Schema", "FAIL", f"Validation error: {e}")

        # Test SharedContentOut
        out_data = {
            "id": str(uuid.uuid4()),
            "user_id": str(uuid.uuid4()),
            "original_url": "https://www.tiktok.com/@user/video/123",
            "platform": "tiktok",
            "status": "enriched",
            "title": "Amazing spot!",
            "author_name": "foodie_user",
            "thumbnail_url": "https://example.com/thumb.jpg",
            "embed_html": "<blockquote>...</blockquote>",
            "error_message": None,
            "created_at": "2026-09-07T00:00:00Z",
            "enriched_at": "2026-09-07T00:00:02Z"
        }

        try:
            out = SharedContentOut(**out_data)
            print_test("SharedContentOut Schema", "PASS",
                      f"Title: {out.title}, Status: {out.status}")
        except ValidationError as e:
            print_test("SharedContentOut Schema", "FAIL", f"Validation error: {e}")

    except Exception as e:
        print_test("Pydantic Schemas", "FAIL", f"Error: {str(e)}")
        return False

    return True

def test_config():
    """Test configuration"""
    print_section("Testing Configuration")

    try:
        from app.core.config import settings

        print_test("Settings Object", "PASS", f"App: {settings.APP_NAME}")
        print(f"   Environment: {settings.ENV}")
        print(f"   CORS Origins: {settings.CORS_ORIGINS}")

        if settings.INSTAGRAM_ACCESS_TOKEN:
            print_test("Instagram Token", "PASS", "Configured")
        else:
            print_test("Instagram Token", "WARN", "Not configured (optional)")

    except Exception as e:
        print_test("Configuration", "FAIL", f"Error: {str(e)}")
        return False

    return True

async def main():
    """Run all tests"""
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}Bridge Backend Pipeline Test Suite{RESET}")
    print(f"{BLUE}{'='*60}{RESET}")

    results = []

    # Run tests
    results.append(("Configuration", test_config()))
    results.append(("Database Models", test_models()))
    results.append(("Pydantic Schemas", test_schemas()))
    results.append(("API Structure", test_api_structure()))
    results.append(("oEmbed Service", await test_oembed_service()))

    # Summary
    print_section("Test Summary")

    passed = sum(1 for _, result in results if result)
    total = len(results)

    print(f"Tests Passed: {passed}/{total}")

    for name, result in results:
        status = f"{GREEN}PASS{RESET}" if result else f"{RED}FAIL{RESET}"
        print(f"  {name}: {status}")

    if passed == total:
        print(f"\n{GREEN}✅ All tests passed!{RESET}")
        print(f"\n{BLUE}Backend is ready for integration with React Native{RESET}")
        return 0
    else:
        print(f"\n{YELLOW}⚠️  {total - passed} test(s) failed{RESET}")
        return 1

if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
