import requests
import json
from db_handler import insert_stats, update_history
from datetime import datetime, timedelta
import schedule
import time
import pytz 

def single_api_request():
    try:
        response = requests.get('https://miejskoaktywni.pl/api/activities_table_items')
        json_data = json.loads(response.text)
    except requests.exceptions.ConnectionError:
        print("Error connecting to the API")
        return None
    single_scrap = {}
    for x in json_data:
        title = x.get('title', None)
        string = x.get('content', None)
        start_index = string.find(':') + 2
        end_index = string.find(' ', start_index)
        variable = string[start_index:end_index]
        variable = int(variable)
        if "sportowa" in title.lower():
            single_scrap['sport'] = variable
        elif "rodzinna" in title.lower():
            single_scrap['family'] = variable
        elif "kameralna" in title.lower():
            single_scrap['small'] = variable
        elif "lodowisko" in title.lower():
            single_scrap['ice'] = variable
    return single_scrap

def push_to_db():
    pl = pytz.timezone('Europe/Warsaw')
    new_time = datetime.now().astimezone(pl)
    single_scrap_content = single_api_request()
    if single_scrap_content is None:
        print("Error receiving data from API.")
        return
    print(str(new_time), str(single_scrap_content))
    sport, family, small, ice = single_scrap_content['sport'], single_scrap_content['family'], single_scrap_content['small'], single_scrap_content['ice']
    insert_stats(new_time, people_sport=sport, people_family=family, people_small=small, people_ice=ice)
    
schedule.every().hour.at(":00").do(push_to_db)
schedule.every().hour.at(":15").do(push_to_db)
schedule.every().hour.at(":30").do(push_to_db)
schedule.every().hour.at(":45").do(push_to_db)
schedule.every().day.at("00:05").do(update_history)

print("Scheduler started.")
while True:
    schedule.run_pending()
    time.sleep(1)