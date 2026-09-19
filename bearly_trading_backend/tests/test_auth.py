import pytest
from app import models

def test_register_user(client):
    # Test successful registration
    response = client.post("/users/register", json={
        "username": "testtrader",
        "email": "test@example.com",
        "password": "securepassword123"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "testtrader"
    assert data["email"] == "test@example.com"
    assert "id" in data
    assert data["cash_balance"] == 100000.0

    # Test registering duplicate email
    response_dup = client.post("/users/register", json={
        "username": "anothername",
        "email": "test@example.com",
        "password": "anotherpassword"
    })
    assert response_dup.status_code == 400
    assert "Email already registered" in response_dup.json()["detail"]

def test_login_user(client):
    # Register first
    client.post("/users/register", json={
        "username": "loginuser",
        "email": "login@example.com",
        "password": "mypassword"
    })

    # Successful Login
    response = client.post("/users/login", json={
        "email": "login@example.com",
        "password": "mypassword"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["email"] == "login@example.com"
    assert response.cookies.get("refresh_token") is not None

    # Failed Login
    response_fail = client.post("/users/login", json={
        "email": "login@example.com",
        "password": "wrongpassword"
    })
    assert response_fail.status_code == 401

def test_account_lockout(client):
    # Register user
    client.post("/users/register", json={
        "username": "lockuser",
        "email": "lock@example.com",
        "password": "validpassword"
    })

    # Fail login 5 times
    for _ in range(5):
        response = client.post("/users/login", json={
            "email": "lock@example.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401

    # The 6th attempt should return 403 Forbidden because account is locked
    response_locked = client.post("/users/login", json={
        "email": "lock@example.com",
        "password": "validpassword"
    })
    assert response_locked.status_code == 403
    assert "Account is locked" in response_locked.json()["detail"]

def test_refresh_token_rotation(client):
    # Register & Login
    client.post("/users/register", json={
        "username": "refreshuser",
        "email": "refresh@example.com",
        "password": "password1"
    })
    login_res = client.post("/users/login", json={
        "email": "refresh@example.com",
        "password": "password1"
    })
    refresh_cookie = login_res.cookies.get("refresh_token")

    # Rotate token
    client.cookies.set("refresh_token", refresh_cookie)
    rotate_res = client.post("/users/refresh")
    assert rotate_res.status_code == 200
    assert "access_token" in rotate_res.json()
    new_refresh_cookie = rotate_res.cookies.get("refresh_token")
    assert new_refresh_cookie != refresh_cookie

    # Attempt to reuse old revoked token: should fail and raise 401
    client.cookies.set("refresh_token", refresh_cookie)
    reuse_res = client.post("/users/refresh")
    assert reuse_res.status_code == 401

def test_password_reset_and_email_verification(client):
    # Register
    reg_res = client.post("/users/register", json={
        "username": "resetuser",
        "email": "reset@example.com",
        "password": "oldpassword"
    })
    
    # Login to get access token
    login_res = client.post("/users/login", json={
        "email": "reset@example.com",
        "password": "oldpassword"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Verify Email
    verify_res = client.post("/users/verify-email", headers=headers)
    assert verify_res.status_code == 200
    assert "verified" in verify_res.json()["message"]

    # Request Reset (simulation logs action)
    req_res = client.post("/users/reset-password/request", json={"email": "reset@example.com"})
    assert req_res.status_code == 200

    # Confirm Reset
    conf_res = client.post("/users/reset-password/confirm", json={
        "email": "reset@example.com",
        "new_password": "newpassword123"
    })
    assert conf_res.status_code == 200

    # Test login with new password
    new_login = client.post("/users/login", json={
        "email": "reset@example.com",
        "password": "newpassword123"
    })
    assert new_login.status_code == 200
