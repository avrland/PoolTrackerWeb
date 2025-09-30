# PoolTracker Scrapper
Pool occupancy stats scrapper. This script puts the number of people present at the pool with datetime to database. Data is fetched every 15 minutes. Datetime is covering DST changes, region is fixed to Europe/Warsaw. Once per day script calculates mean stats and updates results in poolStats_history table. 

### Data fetched from api
```json
[
    {
        "title": "Pływalnia Sportowa",
        "content": "Aktualnie na pływalni: 96 osób<br />Maksymalnie: 105 osób",
        "type": "pływalnia sportowa",
        "id": 1,
        "isActive": true,
        "createdAt": "2022-04-29T01:27:21+02:00",
        "updateAt": "2022-04-29T01:27:21+02:00",
        "active": true
    },
    {
        "title": "Pływalnia Rodzinna",
        "content": "Aktualnie na pływalni: 95 osób<br />Maksymalnie: 150 osób",
        "type": "pływalnia rodzinna",
        "id": 2,
        "isActive": true,
        "createdAt": "2022-05-05T23:25:56+02:00",
        "updateAt": "2022-05-05T23:25:56+02:00",
        "active": true
    },
    {
        "title": "Pływalnia Kameralna",
        "content": "Aktualnie na pływalni: 25 osób<br />Maksymalnie: 30 osób",
        "type": "pływalnia kameralna",
        "id": 4,
        "isActive": true,
        "createdAt": "2022-07-31T11:01:56+02:00",
        "updateAt": "2022-07-31T11:01:56+02:00",
        "active": true
    },
    {
        "title": "Lodowisko",
        "content": "Aktualnie na ślizgawce: 0 osób<br />Maksymalnie: 300 osób",
        "type": "lodowisko",
        "id": 5,
        "isActive": true,
        "createdAt": "2022-08-08T09:46:01+02:00",
        "updateAt": "2022-08-08T09:46:01+02:00",
        "active": true
    }
]
```
There are 4 categories, I insert number of people present to db in this pattern:

- "Pływalnia Sportowa" to sport column
- "Pływalnia Rodzinna" to family column
- "Pływalnia Kameralna" to small column
- "Lodowisko" to ice column


### Data inserted to db. 
```csv
"date","sport","family","small","ice","guid"
"2023-03-05 07:30:00","86","81","18","0","041b8386-bb26-11ed-b3f1-960000b5fbdb"
"2023-03-05 08:00:00","87","70","18","0","041b85d4-bb26-11ed-b3f1-960000b5fbdb"
"2023-03-05 08:30:00","99","88","23","0","0ffd139d-5b4e-4fcd-a8b6-3cfef862ad62"
```

## PoolTrackerWeb
For complete web UI, head to [PoolTrackerWeb](https://github.com/avrland/PoolTrackerWeb) part of PoolTracker project. 

