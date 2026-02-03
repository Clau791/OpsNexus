import pandas as pd
import io
from api_integrations import get_nagios_alerts, get_optimum_tickets

def aggregate_data(start_date, end_date, company_id):
    """
    Fetches data from both sources and returns a dictionary of lists.
    """
    alerts = get_nagios_alerts(start_date, end_date, company_id)
    tickets = get_optimum_tickets(start_date, end_date, company_id)
    
    return {
        "alerts": alerts,
        "tickets": tickets
    }

def generate_csv_export(data):
    """
    Takes aggregated data and returns a CSV string (or bytes).
    In this example, we'll create two sections in one CSV or just merge them if they have common fields.
    For simplicity, let's just export alerts for now, or maybe combined list.
    Let's create a report that lists everything in chronological order.
    """
    alerts = data.get("alerts", [])
    tickets = data.get("tickets", [])
    
    # Normalize data for single CSV
    rows = []
    
    for a in alerts:
        rows.append({
            "Type": "Alert",
            "ID": a["id"],
            "Timestamp": a["timestamp"],
            "Details": f"{a['host']} - {a['service']} - {a['message']}",
            "Status": a["status"]
        })
        
    for t in tickets:
        rows.append({
            "Type": "Ticket",
            "ID": t["id"],
            "Timestamp": t["created_at"],
            "Details": t["subject"],
            "Status": t["status"]
        })
        
    df = pd.DataFrame(rows)
    
    # Sort by Timestamp
    if not df.empty:
        df["Timestamp"] = pd.to_datetime(df["Timestamp"])
        df = df.sort_values(by="Timestamp")
    
    output = io.StringIO()
    df.to_csv(output, index=False)
    return output.getvalue()
