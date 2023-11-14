/// <reference path="jquery-3.7.0.js" />

"use strict";

$(() => {
    // Initial function to handle the "Home" page
    handleHome();

    // Click event for navigation links
    $("a.nav-link").click(function () {
        // Pill UI: Handle navigation link styles
        $("a.nav-link").removeClass("active");
        $(this).addClass("active");

        // Display correct section based on the clicked link
        const sectionId = $(this).attr("data-section");
        $("section").hide();
        $("#" + sectionId).show();
    });

    // Click event for "More Info" buttons within the coins container
    $("#coinsContainer").on("click", ".more-info", async function () {
        const coinId = $(this).attr("id").substring(7);
        await handleMoreInfo(coinId);
    });

    // Click event for the "Home" link
    $("#homeLink").click(async () => {
        $("#searchInput").show();
        $("#searchButton").show();
        await handleHome();
    });

    // Click event for the "Live Reports" link
    $("#reportsLink").click(() => {
        $("#searchInput").hide();
        $("#searchButton").hide();
        displayChart();
    });

    // Click event for the "About" link
    $("#aboutLink").click(() => {
        $("#searchInput").hide();
        $("#searchButton").hide();
    });

    // Arrays to store coin data, selected switches, and their container
    let coins = [];
    let selectedSwitches = [];
    let selectedSwitchesContainer = [];

    // Function to handle the "Home" page
    async function handleHome() {
        // Retrieve coin data (either from API or JSON file)
        coins = await getJson("coins.json");
        // Display coins on the page
        displayCoins(coins);

        // Get initially selected switches and attach change event
        selectedSwitches = $(".form-check-input:checked");
        attachSwitchesChangeEvent();
    }

    // Function to display coins on the page
    function displayCoins(coins) {
        // Filter coins based on symbol length
        coins = coins.filter((c) => c.symbol.length <= 3);
        let html = "";
        // Generate HTML for each coin card
        for (let i = 0; i < 100; i++) {
            html += `
            <div class="card" style="width: 18rem; height: 20rem; overflow: hidden;">
                <!-- Coin details -->
                <div class="card-body">
                    <h5 class="card-title">${coins[i].symbol}</h5>
                    <p class="card-text">${coins[i].name}</p>
                    <!-- Switch for coin selection -->
                    <div style="margin-top: 25px; margin-right: 10px;" class="form-check form-switch position-absolute top-0 end-0">
                        <input class="form-check-input" type="checkbox" name="" id="switch_${coins[i].id}" value="${coins[i].symbol}" data-coin-name="${coins[i].symbol}">
                    </div>
                </div>
                <!-- More Info button and collapsible content -->
                <button style="margin-left: 10px" id="button_${coins[i].id}" class="btn btn-primary more-info" data-bs-toggle="collapse" data-bs-target="#collapse_${coins[i].id}">
                    More Info
                </button>
                <div style="min-height: 120px;">
                    <div class="collapse collapse-horizontal" id="collapse_${coins[i].id}">
                        <div style="margin-left: 10px;" class="card card-body">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            `;
        }
        // Inject HTML into the coins container
        $("#coinsContainer").html(html);
    }

    // Function to handle "More Info" for a specific coin
    async function handleMoreInfo(coinId) {
        // Fetch detailed information about the coin from the API
        const coin = await getJson("https://api.coingecko.com/api/v3/coins/" + coinId);
        // Extract relevant information for display
        const imageSource = coin.image.thumb;
        const usd = coin.market_data.current_price.usd;
        const eur = coin.market_data.current_price.eur;
        const ils = coin.market_data.current_price.ils;
        const moreInfo = `
            <img src="${imageSource}"> <br>
            USD: ${usd} $<br>
            EUR: ${eur} Є<br>
            ILS: ${ils} ₪
        `;
        // Inject more information into the corresponding collapse container
        $(`#collapse_${coinId}`).html(moreInfo);
    }

    // Function to fetch JSON data from a given URL
    async function getJson(url) {
        const response = await fetch(url);
        const json = await response.json();
        return json;
    }

    // Function to filter coins based on search input
    function filterCoins(searchValue) {
        const coins = $(".card");
        coins.each(function () {
            const coinCode = $(this).find(".card-title").text().toLowerCase();
            if (coinCode === searchValue) {
                $(this).show();
            } else {
                $(this).hide();
            }
        });
    }

    // Click event for the search button
    $("#searchButton").click(function (event) {
        event.preventDefault();
        validateAndFilterCoins();
    });

    // Keyup event for the search input
    $("#searchInput").keyup(function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            validateAndFilterCoins();
        }
    });

    // Function to validate search input and filter coins
    function validateAndFilterCoins() {
        const searchValue = $("#searchInput").val().trim().toLowerCase();
        if (searchValue.length === 3) {
            filterCoins(searchValue);
        } else {
            alert("Please Enter Exactly 3 Characters");
            $(".card").show();
        }
    }

    // Function to display a modal when the number of selected coins exceeds 5
    function displayModal(selectedSwitches) {
        // Generate HTML for selected coins in the modal
        const selectedCoinHtml = selectedSwitches.map(function () {
            const coinId = $(this).attr("id").substring(7);
            const coinName = $(this).closest(".card-body").find(".card-text").text();
            return `
                <div class="form-check form-switch">
                    <input class="form-check-input switch-modal" type="checkbox" id="switch_${coinId}" checked>
                    <label class="form-check-label no-click" for="switch_${coinId}">
                        ${coinName}
                    </label>
                </div>
            `;
        }).get().join("");

        // Generate HTML for the modal
        const modalHtml = `
            <div class="modal fade" id="switchModal" tabindex="-1" aria-labelledby="switchModalLabel" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="switchModalLabel">Exceeded Coin Limit</h5>
                        </div>
                        <div class="modal-body">
                            <p>You have selected more than 5 coins. Please turn off one of the following coins:</p>
                            ${selectedCoinHtml}
                        </div>
                        <div class="modal-footer">
                            <p>If you click on "Clear" button, all selected coins will be automatically removed.</p>
                        </div>
                        <span class="error-span" style="color: red; margin-left: 10px;"></span>
                        <div class="modal-footer buttons-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Clear</button>
                            <button id="saveButton" type="button" class="btn btn-primary">Save</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal and append the new one to the body
        $("#switchModal").remove();
        $("body").append(modalHtml);

        // Handle the modal Clear event
        $("#switchModal").on("hidden.bs.modal", function () {
            handleClearButton();
        });

        // Handle the "Save" button click event in the modal
        $("#saveButton").click(function () {
            if ($(".switch-modal:not(:checked)").length === 0) {
                $(".error-span").text("Please turn off at least one coin before saving.");
            } else {
                $(".error-span").text("");
                handleSaveButton(selectedSwitches);
            }
        });

        // Disable click events for coin names in the modal
        $(".no-click").css("pointer-events", "none");

        // Show the modal
        $("#switchModal").modal("show");
    }

    // Function to handle the "Clear" button in the modal
    function handleClearButton() {
        const selectedSwitches = $(".form-check-input:checked");
        selectedSwitches.prop("checked", false);
        hideModal();
    }

    // Function to handle the "Save" button in the modal
    function handleSaveButton(selectedSwitches) {
        const switchesToTurnOff = $(".switch-modal:not(:checked)");

        // Remove any existing error message spans
        $(".modal-footer .buttons-container span.error-message").remove();

        // If no coin is switched off, display the error message and return
        if (switchesToTurnOff.length === 0) {
            const errorMessage = $("<span>")
                .text("Please turn off at least one coin")
                .addClass("error-message")
                .css("color", "red");
            $(".modal-footer .buttons-container").append(errorMessage);
            return;
        }

        // Create an array to store the IDs of the coins to be removed
        const coinsToRemove = [];

        switchesToTurnOff.each(function () {
            const coinId = $(this).attr("id").substring(7);
            const switchButton = $("#switch_" + coinId);
            switchButton.prop("checked", false);
            coinsToRemove.push(coinId); // Store the ID of the coin to be removed
        });

        // Remove the selected coins from the global array
        coins = coins.filter((coin) => !coinsToRemove.includes(coin.id));

        // If there are no selected coins after removal, show the modal for removing the last coin
        if (selectedSwitches.length === 0) {
            displayModal(selectedSwitchesContainer);
        } else {
            hideModal();
        }
    }

    // Click event for the "Save" button in the modal
    $("#saveButton").click(function () {
        handleSaveButton(selectedSwitchesContainer);
    });

    // Click event for the Close button in the modal
    $("#switchModal").on("hidden.bs.modal", function () {
        handleClearButton();
    });

    // Function to hide the modal
    function hideModal() {
        $("#switchModal").modal("hide");
        $("#switchModal").remove();
        $(".switch-modal").remove();
    }

    // Function to attach change event to form-check-input elements
    function attachSwitchesChangeEvent() {
        $(".form-check-input").off("change").on("change", function () {
            selectedSwitches = $(".form-check-input:checked");
            if (selectedSwitches.length > 5) {
                displayModal(selectedSwitches);
            } else {
                hideModal();
            }
        });
    }

    // Function to display a chart with real-time prices of selected coins
    async function displayChart() {
        // Get selected currencies
        const SelectedCurrencies = $("input[name='']:checked").map(function () {
            return this.value;
        }).get();

        // Create a new chart
        let graph = new CanvasJS.Chart("chartContainer", {
            title: { text: `${SelectedCurrencies.join(", ")} to USD` },
            axisY: {
                includeZero: false,
                title: " USD",
                prefix: "$"
            },
            axisX: { valueFormatString: "HH:mm:ss" },
            data: []
        });

        // Add details for each selected coin to the chart
        for (let i = 0; i < SelectedCurrencies.length; i++) {
            let currencyName = SelectedCurrencies[i];
            let details = {
                type: "line",
                name: currencyName,
                showInLegend: true,
                dataPoints: []
            };
            graph.options.data.push(details);
        }

        // Function to get the coins' prices from the API
        async function getCurrenciesPrices() {
            const newLocalTime = new Date();
            const linkApi = `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${SelectedCurrencies.join(",")}&tsyms=USD`;
            const dataFromApi = await getJson(linkApi);

            // Chart details
            for (let i = 0; i < graph.options.data.length; i++) {
                let currencyName = graph.options.data[i].name;
                let nameUpper = currencyName.toUpperCase();
                let price = dataFromApi[nameUpper]?.USD;

                if (graph.options.data[i].dataPoints === undefined) {
                    graph.options.data[i].dataPoints = [];
                }
                graph.options.data[i].dataPoints.push({ x: newLocalTime, y: price });
            }

            // Refresh the chart
            graph.render();
        }

        if (SelectedCurrencies.length === 0) {
            // If no selected currencies, display an error message
            $("#errorMessage").show()
        } else {
            $("#errorMessage").hide()
            // Call to get currency details
            getCurrenciesPrices();

            // Refresh the chart's details every two seconds
            setInterval(getCurrenciesPrices, 2000);
        }
    }

    // Initial call to display the chart
    displayChart();
})
