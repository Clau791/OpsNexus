import pandas as pd
import io
# Support both local execution and package import on Vercel.
try:
    from .api_integrations import get_nagios_alerts, get_optimum_tickets
except ImportError:
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

def generate_excel_export(data):
    """
    Takes aggregated data and returns an Excel file (bytes).
    Includes Summary Dashboard with Charts, and detailed data sheets.
    """
    alerts = data.get("alerts", [])
    tickets = data.get("tickets", [])
    
    # Create DataFrames
    df_alerts = pd.DataFrame(alerts)
    if not df_alerts.empty:
        df_alerts["timestamp"] = pd.to_datetime(df_alerts["timestamp"])
        df_alerts = df_alerts[["id", "timestamp", "host", "service", "status", "message"]]
        
    df_tickets = pd.DataFrame(tickets)
    if not df_tickets.empty:
        df_tickets["created_at"] = pd.to_datetime(df_tickets["created_at"])
        df_tickets = df_tickets[["id", "created_at", "subject", "status"]]

    output = io.BytesIO()
    
    # Use XlsxWriter engine for charts
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        workbook = writer.book
        
        # --- 1. Dashboard Sheet ---
        worksheet_dash = workbook.add_worksheet('Dashboard')
        writer.sheets['Dashboard'] = worksheet_dash
        worksheet_dash.set_column('A:Z', 20)
        
        bold_format = workbook.add_format({'bold': True, 'font_size': 14})
        worksheet_dash.write('A1', 'OpsNexus Report Dashboard', bold_format)
        
        # Prepare data for charts (Status Counts)
        if not df_alerts.empty:
            alert_counts = df_alerts['status'].value_counts()
            worksheet_dash.write('A3', 'Alert Status Distribution')
            worksheet_dash.write_column('A4', alert_counts.index)
            worksheet_dash.write_column('B4', alert_counts.values)
            
            # Create Alert Chart
            chart_alerts = workbook.add_chart({'type': 'pie'})
            chart_alerts.add_series({
                'name': 'Alerts',
                'categories': ['Dashboard', 3, 0, 3 + len(alert_counts) - 1, 0],
                'values':     ['Dashboard', 3, 1, 3 + len(alert_counts) - 1, 1],
            })
            chart_alerts.set_title({'name': 'Alert Status'})
            worksheet_dash.insert_chart('A10', chart_alerts)

        if not df_tickets.empty:
            ticket_counts = df_tickets['status'].value_counts()
            worksheet_dash.write('E3', 'Ticket Status Distribution')
            worksheet_dash.write_column('E4', ticket_counts.index)
            worksheet_dash.write_column('F4', ticket_counts.values)
            
            # Create Ticket Chart
            chart_tickets = workbook.add_chart({'type': 'pie'})
            chart_tickets.add_series({
                'name': 'Tickets',
                'categories': ['Dashboard', 3, 4, 3 + len(ticket_counts) - 1, 4],
                'values':     ['Dashboard', 3, 5, 3 + len(ticket_counts) - 1, 5],
            })
            chart_tickets.set_title({'name': 'Ticket Status'})
            worksheet_dash.insert_chart('E10', chart_tickets)

        # --- 2. Alerts Data Sheet ---
        if not df_alerts.empty:
            df_alerts.to_excel(writer, sheet_name='Alerts Data', index=False)
            
        # --- 3. Tickets Data Sheet ---
        if not df_tickets.empty:
            df_tickets.to_excel(writer, sheet_name='Tickets Data', index=False)
            
    return output.getvalue()
