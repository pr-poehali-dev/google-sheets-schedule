import json
import os
import urllib.request
import urllib.error

def handler(event: dict, context) -> dict:
    """
    Загрузка расписания из Google Sheets
    """
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }

    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'})
        }

    api_key = os.environ.get('GOOGLE_SHEETS_API_KEY')
    if not api_key:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Google Sheets API key not configured'})
        }

    spreadsheet_id = '1FiMov0r4UUDKT6A56NWMImpoUakDC2YDevgaOpJQ7Qc'
    
    query_params = event.get('queryStringParameters') or {}
    sheet_name = query_params.get('sheet', 'расписание для 2-4 курса на 1-6')
    
    range_name = f'{sheet_name}!A:Z'
    
    url = f'https://sheets.googleapis.com/v4/spreadsheets/{spreadsheet_id}/values/{range_name}?key={api_key}'

    try:
        with urllib.request.urlopen(url) as response:
            data = json.loads(response.read().decode())
            
        values = data.get('values', [])
        
        if not values or len(values) < 2:
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'schedule': []})
            }

        headers = values[0]
        rows = values[1:]

        schedule = []
        for row in rows:
            if len(row) < 3:
                continue
            
            item = {}
            for i, header in enumerate(headers):
                item[header] = row[i] if i < len(row) else ''
            
            if item.get('date') and item.get('time_start'):
                schedule.append(item)

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'schedule': schedule})
        }

    except urllib.error.HTTPError as e:
        error_body = e.read().decode() if e.fp else str(e)
        return {
            'statusCode': e.code,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Failed to fetch Google Sheets data',
                'details': error_body
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'details': str(e)
            })
        }