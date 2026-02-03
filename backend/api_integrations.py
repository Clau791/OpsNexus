import random
from datetime import datetime, timedelta

def get_nagios_alerts(start_date: datetime, end_date: datetime, company_id: int):
    """
    Simulates fetching alerts from Nagios.
    Returns a list of dictionaries representing alerts.
    """
    alerts = []
    current_date = start_date
    
    status_options = ["CRITICAL", "WARNING", "OK", "UNKNOWN"]
    host_options = ["srv-web-01", "srv-db-01", "srv-app-02", "firewall-main"]
    
    # Generate random alerts within the date range
    while current_date <= end_date:
        # 0 to 5 alerts per day
        daily_alerts_count = random.randint(0, 5)
        for _ in range(daily_alerts_count):
            alert = {
                "id": random.randint(1000, 9999),
                "timestamp": current_date.isoformat(),
                "host": random.choice(host_options),
                "service": "CPU Load" if random.random() > 0.5 else "Memory Usage",
                "status": random.choice(status_options),
                "message": "Threshold exceeded",
                "company_id": company_id
            }
            alerts.append(alert)
        current_date += timedelta(days=1)
        
    return alerts

def get_optimum_tickets(start_date: datetime, end_date: datetime, company_id: int):
    """
    Simulates fetching tickets from Optimum Desk.
    Returns a list of dictionaries representing tickets.
    """
    tickets = []
    current_date = start_date
    
    status_options = ["Open", "In Progress", "Resolved", "Closed"]
    
    # Generate random tickets within the date range
    while current_date <= end_date:
        # 0 to 3 tickets per day
        daily_tickets_count = random.randint(0, 3)
        for _ in range(daily_tickets_count):
            ticket = {
                "id": random.randint(10000, 99999),
                "created_at": current_date.isoformat(),
                "subject": f"Issue with {random.choice(['email', 'printer', 'network', 'vpn'])}",
                "status": random.choice(status_options),
                "company_id": company_id
            }
            tickets.append(ticket)
        current_date += timedelta(days=1)
        
    return tickets
