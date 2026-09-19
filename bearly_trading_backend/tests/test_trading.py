import pytest

def get_auth_headers(client, email, username, password="password123"):
    # Register & Login
    client.post("/users/register", json={
        "username": username,
        "email": email,
        "password": password
    })
    res = client.post("/users/login", json={
        "email": email,
        "password": password
    })
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_execute_buy_trade(client):
    headers = get_auth_headers(client, "buyer@example.com", "buyer123")

    # AAPL is mocked at $150.0. User starts with $100,000.
    # Buy 10 shares of AAPL = $1500 cost.
    response = client.post("/trading/trade", json={
        "symbol": "AAPL",
        "quantity": 10,
        "trade_type": "buy"
    }, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["symbol"] == "AAPL"
    assert data["quantity"] == 10
    assert data["price"] == 150.0
    assert data["trade_type"] == "buy"

    # Verify cash balance reduced by $1500 to $98500
    profile_res = client.get("/users/me", headers=headers)
    assert profile_res.json()["cash_balance"] == 98500.0

def test_execute_buy_insufficient_funds(client):
    headers = get_auth_headers(client, "poor@example.com", "poor123")

    # AAPL is mocked at $150.0. Max user cash is $100,000.
    # Attempt to buy 1000 shares of AAPL = $150,000 cost (exceeds balance).
    response = client.post("/trading/trade", json={
        "symbol": "AAPL",
        "quantity": 1000,
        "trade_type": "buy"
    }, headers=headers)
    assert response.status_code == 400
    assert "Insufficient funds" in response.json()["detail"]

def test_execute_sell_trade(client):
    headers = get_auth_headers(client, "seller@example.com", "seller123")

    # Buy 10 AAPL first
    client.post("/trading/trade", json={
        "symbol": "AAPL",
        "quantity": 10,
        "trade_type": "buy"
    }, headers=headers)

    # Sell 4 AAPL at $150 = $600 proceeds
    response = client.post("/trading/trade", json={
        "symbol": "AAPL",
        "quantity": 4,
        "trade_type": "sell"
    }, headers=headers)
    assert response.status_code == 200
    assert response.json()["trade_type"] == "sell"

    # Verify cash is $100000 - $1500 + $600 = $99100
    profile_res = client.get("/users/me", headers=headers)
    assert profile_res.json()["cash_balance"] == 99100.0

    # Attempt to sell more than owned (owns 6 now, try to sell 10)
    response_fail = client.post("/trading/trade", json={
        "symbol": "AAPL",
        "quantity": 10,
        "trade_type": "sell"
    }, headers=headers)
    assert response_fail.status_code == 400
    assert "Not enough shares to sell" in response_fail.json()["detail"]

def test_portfolio_retrieval(client):
    headers = get_auth_headers(client, "portfolio@example.com", "portuser")

    # Execute trades: Buy 10 AAPL at $150, Buy 5 MSFT at $300 ($1500 + $1500 = $3000 total cost)
    client.post("/trading/trade", json={"symbol": "AAPL", "quantity": 10, "trade_type": "buy"}, headers=headers)
    client.post("/trading/trade", json={"symbol": "MSFT", "quantity": 5, "trade_type": "buy"}, headers=headers)

    # Fetch Portfolio
    response = client.get("/portfolio", headers=headers)
    assert response.status_code == 200
    items = response.json()
    assert len(items) == 2
    
    # Assert AAPL portfolio item values
    aapl_item = next(x for x in items if x["symbol"] == "AAPL")
    assert aapl_item["quantity"] == 10
    assert aapl_item["avgPrice"] == 150.0
    assert aapl_item["currentPrice"] == 150.0
    assert aapl_item["totalValue"] == 1500.0
    assert aapl_item["gainLoss"] == 0.0

def test_watchlist_operations(client):
    headers = get_auth_headers(client, "watch@example.com", "watchuser")

    # Add MSFT
    add_res = client.post("/watchlist/add", json={"symbol": "MSFT"}, headers=headers)
    assert add_res.status_code == 200

    # Get watchlist
    list_res = client.get("/watchlist", headers=headers)
    assert list_res.status_code == 200
    assert "MSFT" in list_res.json()

    # Remove MSFT
    rem_res = client.delete("/watchlist/remove/MSFT", headers=headers)
    assert rem_res.status_code == 200

    # Get watchlist again
    list_res_2 = client.get("/watchlist", headers=headers)
    assert "MSFT" not in list_res_2.json()

def test_gdpr_data_compliance(client):
    headers = get_auth_headers(client, "gdpr@example.com", "gdpruser")
    
    # Do a trade
    client.post("/trading/trade", json={"symbol": "AAPL", "quantity": 2, "trade_type": "buy"}, headers=headers)

    # Export Data
    exp_res = client.get("/users/export-data", headers=headers)
    assert exp_res.status_code == 200
    data = exp_res.json()
    assert data["profile"]["username"] == "gdpruser"
    assert len(data["trades"]) == 1

    # Delete Account
    del_res = client.delete("/users/delete-account", headers=headers)
    assert del_res.status_code == 200

    # Login should fail now as user is purged
    login_res = client.post("/users/login", json={"email": "gdpr@example.com", "password": "password123"})
    assert login_res.status_code == 401
