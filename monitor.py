import requests
import socket
import ssl
import time
import csv
import os
from datetime import datetime

HOST = "mithal.space"
URL = f"https://{HOST}"
SEARCH_URL = f"{URL}/?q=test"

CSV_FILE = "metrics.csv"


def check_latency():
    start = time.time()

    response = requests.get(URL, timeout=10)

    latency = round((time.time() - start) * 1000, 2)

    return latency, response.status_code


def check_dns():

    start = time.time()

    socket.gethostbyname(HOST)

    dns_time = round((time.time() - start) * 1000, 2)

    return dns_time


def check_ssl():

    context = ssl.create_default_context()

    with context.wrap_socket(
        socket.socket(),
        server_hostname=HOST
    ) as s:

        s.settimeout(10)

        s.connect((HOST, 443))

        cert = s.getpeercert()

    expire = cert["notAfter"]

    expire_date = datetime.strptime(
        expire,
        "%b %d %H:%M:%S %Y %Z"
    )

    remaining = (expire_date - datetime.utcnow()).days

    return expire_date.strftime("%Y-%m-%d"), remaining


def check_search():

    start = time.time()

    requests.get(SEARCH_URL, timeout=10)

    search_latency = round(
        (time.time() - start) * 1000,
        2
    )

    return search_latency


def save_csv(data):

    file_exists = os.path.isfile(CSV_FILE)

    with open(CSV_FILE, "a", newline="") as file:

        writer = csv.writer(file)

        if not file_exists:

            writer.writerow([
                "Timestamp",
                "Latency(ms)",
                "Status",
                "DNS(ms)",
                "SSL Expiry",
                "Days Left",
                "Search(ms)"
            ])

        writer.writerow(data)


def monitor():

    while True:

        try:

            latency, status = check_latency()

            dns = check_dns()

            ssl_date, ssl_days = check_ssl()

            search = check_search()

            now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            row = [
                now,
                latency,
                status,
                dns,
                ssl_date,
                ssl_days,
                search
            ]

            save_csv(row)

            print(row)

        except Exception as e:

            print("Monitoring Error:", e)

        print("Waiting 60 seconds...\n")

        time.sleep(60)


if __name__ == "__main__":
    monitor()

