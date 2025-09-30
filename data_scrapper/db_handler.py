import mysql.connector
from datetime import datetime
import json
import uuid
import pandas as pd 
import pytz
import os
from dotenv import load_dotenv
load_dotenv()

config = {
    'database': os.getenv('DB_NAME'),
    'user': os.getenv('DB_USER'),
    'password': os.getenv('DB_PASSWORD'),
    'host': os.getenv('DB_HOST'),
    'port': int(os.getenv('DB_PORT')) if os.getenv('DB_PORT') else 3306,
}

def insert_stats(date, people_sport, people_family, people_small, people_ice):
    # Connect to the database
    try:
        # Connect to the database
        mydb = mysql.connector.connect(**config)

    except mysql.connector.Error as error:
        # Handle the error
        print("Error connecting to the database: {}".format(error))
        return


    # Create a cursor object
    mycursor = mydb.cursor()

    # Convert the date to a string in the format YYYY-MM-DD HH:MM:SS
    date_str = date.strftime('%Y-%m-%d %H:%M:%S')

    guid = str(uuid.uuid4())

    # SQL query to insert data into the table
    sql = "INSERT INTO poolStats (guid, date, sport, family, small, ice) VALUES (%s, %s, %s, %s, %s, %s)"
    values = (guid, date_str, people_sport, people_family, people_small, people_ice)

    try:
        # Execute the query
        mycursor.execute(sql, values)
        # Commit the changes
        mydb.commit()     
    except mysql.connector.Error as error:
        # Handle the error
        print("Error inserting data into the database: {}".format(error))
    finally:
        # Close the database connection
        mydb.close()

def get_pools_data():
    try:
        # Connect to the database
        mydb = mysql.connector.connect(**config)
        
        # Create the SQL query
        query = """
            SELECT * 
            FROM poolStats 
            WHERE date >= CURDATE() - INTERVAL 30 DAY
            ORDER BY date ASC
        """
        
        # Read the query into a pandas DataFrame
        df = pd.read_sql(query, mydb)
        
        if df.empty:
            print("No entries found in the table.")
            return
        
        return df
            
    except mysql.connector.Error as error:
        print("Error accessing database: {}".format(error))
        return None
    finally:
        if 'mydb' in locals() and mydb.is_connected():
            mydb.close()

def generate_stats(df):
    # Step 1: Drop the `guid` column
    df = df.drop(columns=['guid'])
    
    # Convert data to datetime
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values('date')
    df['time'] = df['date'].dt.time
    df['hour'] = df['date'].dt.hour
    df = df[(df['hour'] >= 6) & (df['hour'] < 22)]
    df['weekday'] = df['date'].dt.day_name()
    df['day'] = df['date'].dt.date
    weekday_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    df['weekday'] = pd.Categorical(df['weekday'], categories=weekday_order, ordered=True)
    # # Clear days with all zero readings (potentitally closed pools)
    zero_days = df.groupby('day').filter(lambda x: (x['family'] == 0).all())['day'].unique()
    df = df[~df['day'].isin(zero_days)]
    num_rows = len(df)
    date_range = df['date'].max() - df['date'].min()
    num_days = df['day'].nunique()
    print(f"Readings amount: {num_rows}")
    print(f"Date of observation range: {date_range}, started: {df['date'].min()}, ended: {df['date'].max()}")
    print(f"Pools working days: {num_days} days")
    avg_df = None
    # Step 4: Group by `weekday` and `time` and calculate averages
    avg_df = df.groupby(['weekday', 'time']).agg(
        sport=('sport', 'mean'),
        family=('family', 'mean'),
        small=('small', 'mean'),
        ice=('ice', 'mean')
    ).reset_index().round()
    avg_df = avg_df.dropna()
    return avg_df

# Insert function for inserting data from DataFrame
def insert_data_from_df(df):
    try:
        # Connect to the database
        mydb = mysql.connector.connect(**config)
        cursor = mydb.cursor()
        # Create the SQL query
        query = """
        INSERT INTO poolStats_history (guid, weekday, time, sport, family, small, ice)
        VALUES (UUID(), %s, %s, %s, %s, %s, %s)
        """
        
        # Iterate over the DataFrame rows and insert each row
        for i, row in df.iterrows():
            cursor.execute(query, (
                row['weekday'],
                row['time'],
                row['sport'],
                row['family'],
                row['small'],
                row['ice']
            ))
    
        # Commit the transaction
        mydb.commit()
    
        # Close the connection
        return df
            
    except mysql.connector.Error as error:
        print("Error accessing database: {}".format(error))
        return None
    finally:
        if 'mydb' in locals() and mydb.is_connected():
            mydb.close()

# Update function for updating data based on weekday and time
def update_data_from_df(df):
    print("Updating poolStats_history")
    
    try:
        # Connect to the database using the loaded config
        mydb = mysql.connector.connect(**config)
        cursor = mydb.cursor()

        # Create the SQL query for update
        update_query = """
        UPDATE poolStats_history
        SET sport = %s, family = %s, small = %s, ice = %s
        WHERE weekday = %s AND time = %s
        """

        # Iterate over the DataFrame rows and update each row
        for i, row in df.iterrows():
            cursor.execute(update_query, (
                row['sport'],
                row['family'],
                row['small'],
                row['ice'],
                row['weekday'],
                row['time']
            ))

        # Commit the transaction
        mydb.commit()

        # Return the DataFrame if the update was successful
        return df

    except mysql.connector.Error as error:
        print("Error accessing database: {}".format(error))
        return None

    finally:
        # Close the database connection if it's open
        if 'mydb' in locals() and mydb.is_connected():
            mydb.close()

def update_history():
    df = get_pools_data()
    df_stats = generate_stats(df)
    if df_stats is not None: #if we fetch any data (df not null)
        update_data_from_df(df_stats)

if __name__ == "__main__":
    #date = datetime(2023, 3, 4, 10, 30, 0)
    #insert_stats(date, 10, 11, 5, 1)
    #df = print_entries()
    update_history()
    