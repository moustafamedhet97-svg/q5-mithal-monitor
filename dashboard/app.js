let chart = null;

async function loadData() {

    try {

        const response = await fetch("../metrics.csv?t=" + Date.now());

        const text = await response.text();

        let rows = text.trim().split("\n");

        if (rows.length <= 1) return;

        // Remove CSV header
        rows.shift();

        const data = rows
            .map(row => row.split(","))
            .filter(row => row.length >= 7);

        const history = document.getElementById("history");
        history.innerHTML = "";

        const now = new Date();

        // ==========================
        // Uptime (24h)
        // ==========================

        const last24 = data.filter(row => {

            const t = new Date(row[0].replace(" ", "T"));

            return (now - t) <= (24 * 60 * 60 * 1000);

        });

        const up = last24.filter(row => row[2] === "200").length;

        const uptime =
            last24.length === 0
                ? 0
                : ((up / last24.length) * 100).toFixed(2);

        document.getElementById("uptime").textContent = uptime + "%";

        // ==========================
        // SSL Status
        // ==========================

        const latest = data[data.length - 1];

        document.getElementById("ssl").textContent =
            latest[5] + " Days Remaining";

        // ==========================
        // Chart
        // ==========================

        let labels = [];
        let values = [];

        data.forEach(row => {

            const latency = parseFloat(row[1]);

            // Ignore abnormal values
            if (latency <= 500) {

                labels.push(row[0].split(" ")[1]);

                values.push(latency);

            }

        });

        drawChart(labels, values);

        // ==========================
        // Last 10 Checks
        // ==========================

        data.slice(-10).reverse().forEach(row => {

            const status = row[2] === "200";

            history.innerHTML += `

            <tr>

                <td>${row[0]}</td>

                <td class="${status ? "up" : "down"}">

                    ${status ? "UP" : "DOWN"}

                </td>

                <td>${row[1]} ms</td>

                <td>${row[3]} ms</td>

                <td>${row[6]} ms</td>

                <td>${row[5]} Days</td>

            </tr>

            `;

        });

    }

    catch (err) {

        console.error("Dashboard Error:", err);

    }

}

function drawChart(labels, values) {

    const canvas = document.getElementById("latencyChart");

    if (!canvas) return;

    if (chart) {

        chart.destroy();

    }

    chart = new Chart(canvas, {

        type: "line",

        data: {

            labels: labels,

            datasets: [

                {

                    label: "Latency (ms)",

                    data: values,

                    borderColor: "#3498db",

                    backgroundColor: "rgba(52,152,219,0.15)",

                    borderWidth: 2,

                    fill: true,

                    tension: 0.3,

                    pointRadius: 3,

                    pointHoverRadius: 5

                }

            ]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            animation: false,

            plugins: {

                legend: {

                    display: true

                }

            },

            scales: {

                y: {

                    min: 0,

                    max: 250,

                    title: {

                        display: true,

                        text: "Milliseconds"

                    }

                },

                x: {

                    title: {

                        display: true,

                        text: "Time"

                    }

                }

            }

        }

    });

}

loadData();

