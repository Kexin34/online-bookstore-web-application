/**
 * Script for implementing a Shopping Cart functionality. 
 * Authors: Kexin
 * Date: 2019-09-26
 */

inactiveTime = 0;
var productView;

/**
 * AJAX implementation to get a response from a given url. 
 * 
 * @param {String} url - url to ping
 * @param {function} onSuccess - callback function on success
 * @param {function} onError - callback function on error
 */
var ajaxGet = function(url, onSuccess, onError) {

    var retries = 3;

    // 1. Create a new XMLHttpRequest object
    let xhr = new XMLHttpRequest();

    // set timeout
    xhr.timeout = 2000; // in miliseconds

    // 2. Configure it: Async GET-request 'url'
    xhr.open('GET', url, true);

    // 3. Send the request over the network
    xhr.send();

    // 4. Receive response from server
    xhr.onload = function() {
        if (xhr.status != 200) { // call on error if error
            if(retries > 1) {
                retries--;
                xhr.open('GET', url, true);
                xhr.send();
            } else {
                onError(xhr.response);
            }
        } else { // call onSuccess if success
            //onSuccess(xhr.response);
            var response = JSON.parse(xhr.responseText);
            onSuccess(response);
  
        }
    };

    // 4. No response received from server
    xhr.onerror = function() {
        if(retries > 1) {
            retries--;
            xhr.open('GET', url, true);
            xhr.send();
        } else {
            onError(xhr.response);
        }
    };

    xhr.ontimeout = function() {
        if(retries > 1) {
            retries--;
            xhr.open('GET', url, true);
            xhr.send();
        } else {
            onError(xhr.response);
        }
    }
}


/**
 * Renders a single product element.
 * 
 * @param {DOM element} container 
 * @param {Store} storeInstance 
 * @param {String} itemName 
 */
function renderProduct(container, storeInstance, itemName) {
    // clear any contents in container 
    container.innerHTML = '';

    // Create <div></div> element
    var productDiv = document.createElement("div");

    // Create img element for the the product
    var productImg = document.createElement("img");
    productImg.setAttribute("id", "productpic");
    productImg.setAttribute("src", storeInstance.stock[itemName].imageUrl); // refer to product list using itemName

    // Create <p></p> element to hold product price
    var productPrice = document.createElement("p");
    productPrice.setAttribute("class", "price");
    productPrice.innerHTML = "$" + storeInstance.stock[itemName].price; // refer to product list

    // Create <p></p> element to hold product name
    var productName = document.createElement("p");
    productName.setAttribute("class", "productName");
    productName.innerHTML = storeInstance.stock[itemName].label; // refer to product list

    // add product elements to div
    productDiv.appendChild(productImg);
    productDiv.appendChild(productPrice);
    productDiv.appendChild(productName);

    // get item quantity from store
    var itemQuantity = storeInstance.stock[itemName].quantity;

    /* Display Add btn if item is in stock */
    if(itemQuantity > 0) {
        var btnAdd = document.createElement("span");
        btnAdd.setAttribute("class", "btn-add");
        btnAdd.setAttribute("onclick", "store.addItemToCart('" + itemName + "')");
        btnAdd.innerHTML = "Add";
        productDiv.appendChild(btnAdd); // if quantity is valid
    }
    
    /* Display remove btn if item is in the cart */
    if(storeInstance.cart === undefined) {
        // do nothing
    } else if(itemName in storeInstance.cart) {
        var btnRemove = document.createElement("span");
        btnRemove.setAttribute("class", "btn-remove");
        btnRemove.setAttribute("onclick", "store.removeItemFromCart('" + itemName + "')");
        btnRemove.innerHTML = "Remove";
        productDiv.appendChild(btnRemove); // if quantity is valid
    }

    // Replace container contents with generated div
    container.appendChild(productDiv);
}

/**
 * Renders product list using renderProduct()
 * 
 * @param {DOM element} container 
 * @param {Store} storeInstance 
 */
function renderProductList(container, storeInstance) {

    while(container == null) {
        // spin until container is null
        // container should not be null
        // only null if window hasn't loaded
    }
    // Get list of all product keys
    var productKeys = Object.keys(storeInstance.stock);

    // create a <ul></ul> element
    var unorderedList = document.createElement("ul");
    unorderedList.setAttribute("id", "productList");

    for (var product in productKeys) {
        // Create container for renderProduct()
        var listItem = document.createElement("li");
        listItem.setAttribute("class", "product");

        // set unique id for container
        var idName = "product-" + productKeys[product];
        listItem.setAttribute("id", idName);

        // call renderProduct 
        //  - assuming renderProduct will modify listItem element
        this.renderProduct(listItem, storeInstance, productKeys[product]);

        // Add listItem to container element
        unorderedList.appendChild(listItem);
    }
    
    // clear replace container content with generated list
    container.innerHTML = '';
    container.appendChild(unorderedList);
}


//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// CLASSES
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
/**
 * Store class with functions to deal with store items:
 *      - void addItemToCart: adds an item to the cart
 *      - void removeItemFromCart: removes an item from the cart
 *      - boolean itemInCart: checks if an item is in the cart
 *      - number getItemQuantity: returns current quantity of item
 * 
 * @param {Object} initialStock 
 */
var Store = function(serverUrl) {
    this.stock = {};
    this.serverUrl = serverUrl;
    this.cart = {};
    this.onUpdate = null;

    this.addItemToCart = function(itemName) {
        // Check if item is in the cart and increment item
        if(itemName in this.cart) {
            if(this.stock[itemName].quantity > 0) {
                this.cart[itemName]++;
                this.stock[itemName].quantity--;
            } else {
                alert("Item out of stock!");
            }
        } else if(itemName in this.stock) {
            // Check if item exists in stock and add it to the cart
            if(this.stock[itemName].quantity > 0) {
                this.cart[itemName] = 1;
                this.stock[itemName].quantity--;
            } else {
                alert("Item out of stock!");
            }
        } else {
            // Error handling: Item is not in cart or stock
            alert("Item does not exist!");
        }
        resetTimeCount();
        this.onUpdate(itemName);
    }

    this.removeItemFromCart = function(itemName) {
        // Check if item is in the cart
        if(itemName in this.cart) {
            // If item is in the cart, remove one item
            if(this.cart[itemName] > 1) {
                this.cart[itemName]--;
                this.stock[itemName].quantity++;
            } else { 
                // If quantity in cart goes to 0, remove object
                delete this.cart[itemName];
                this.stock[itemName].quantity++;
            }
        }
        resetTimeCount();
        this.onUpdate(itemName);
    }

    /* Function checks if item is in the cart */
    this.itemInCart = function(itemName) {
        if(itemName in this.cart) {
            return true;
        } else {
            return false;
        }
    }

    /* Function returns item quantity */
    this.getItemQuantity = function(itemName) {
        return this.stock[itemName].quantity;
    }

    /* Function synchronizes product information provided by the server */ 
    this.syncWithServer = function (onSync) {
        var currentStore = this;
        // make a synchronize request to the server 
        ajaxGet(this.serverUrl + "/products",
            function (response) {
                var storeDeltaList = {};
                //console.log(response);
                for (var itemName in response) {
                    // For the first time loading, add product label and image into the store
                    if (!currentStore.stock.hasOwnProperty(itemName)) {
                        currentStore.stock[itemName] = {
                            label: response[itemName].label,
                            imageUrl: response[itemName].imageUrl,
                            price: 0,
                            quantity: 0
                        };   
                    }
                    // Compute a "delta" object
                    var itemDelta = {
                        price: response[itemName].price - currentStore.stock[itemName].price,
                        quantity: response[itemName].quantity - currentStore.stock[itemName].quantity
                    };
                    // check if it changed since the last time we synchronized，if so, add into dalta list
                    if (itemDelta["price"] != 0 && itemDelta["quantity"] != 0)
                        storeDeltaList[itemName] = itemDelta;
                }

                // Update the stock property (quantity, price) using the object fetched from the server.
                for (var changedProduct in storeDeltaList) {
                    var currcCartQuantity;
                    // Inside the cart, find out products that has changed any property 
                    if (currentStore.cart.hasOwnProperty(changedProduct)) {
                        currcCartQuantity = currentStore.cart[changedProduct];
                    }else
                        currcCartQuantity = 0;
                    var newTotalQuantity =  currentStore.stock[changedProduct].quantity + storeDeltaList[changedProduct].quantity;
                    // If cart quantity does not exceed total, only update stock quantity
                    if (currcCartQuantity <= newTotalQuantity)
                        currentStore.stock[changedProduct].quantity = newTotalQuantity - currcCartQuantity;
                    // If cart quantity exceed total, reallocate all to the cart and empty the stock
                    else {
                        currentStore.cart[changedProduct] = newTotalQuantity;
                        currentStore.stock[changedProduct].quantity = 0;
                    }
                    currentStore.stock[changedProduct].price += storeDeltaList[changedProduct].price;
                }

                // trigger re-rendering of the view.
                currentStore.onUpdate();
                // If onSync argument was provided, call it and pass in the "delta" object as the argument.
                if (onSync != null)
                    onSync(storeDeltaList);
            },
            function (error) {
                xhr.onerror;
            }
        );
    }

    /* Function to perform check-out routine in the cart*/
    this.checkOut = function (onFinish) {
        var currentStore = this;
        // First invoke the syncWithServer method to check that the items are still available,
        // Pass in a callback function with the signature function(delta).
        this.syncWithServer(function (deltaList) {
            // If there are any changed of product price and/or quantity from syncronization 
            if (Object.keys(deltaList).length !== 0) {
                var outputChange = "";
                for (var product in currentStore.cart) {
                    if (deltaList.hasOwnProperty(product)) {
                        // For every changed product inside the cart, compare the price of previous and current product
                        // if there was a change in the stock, alert the user of the changes.
                        if (deltaList[product].price != 0 && currentStore.stock[product].price - deltaList[product].price != 0) {
                            outputChange += "Price of " + product + " changed from $" +(currentStore.stock[product].price - 
                                deltaList[product].price) + " to $" + currentStore.stock[product].price + "\n";
                        }
                        // compare previous and current total quantity
                        var currTotalQuantity = currentStore.stock[product].quantity + currentStore.cart[product];
                        if (deltaList[product].quantity != 0 && currTotalQuantity - deltaList[product].quantity+ currentStore.cart[product] != 0) {
                            outputChange += "Quantity of " + product + " changed from " +(currTotalQuantity - 
                                deltaList[product].quantity+ currentStore.cart[product]) + " to " + currTotalQuantity + "\n";
                        }
                    }
                }
                alert(outputChange);
            } else {
                // If there was no change in the stock and everything is okay to check out, alert the user the total amount due.
                var currentTotalPrice = 0;
                for (var product in currentStore.cart) {
                    currentTotalPrice += currentStore.cart[product] * currentStore.stock[product].price;
                }
                alert("The total price is $" + currentTotalPrice);
            }
            if (onFinish != null)
                onFinish();
        }
        );

    }



}

// Class declaration
var store = new Store("https://cpen400a-bookstore.herokuapp.com");

store.syncWithServer();

// define onUpdate function for store
store.onUpdate = function(itemName) {

    // Re-render entire product list if item is not provided
    if(itemName == null) {
        renderProductList(productView, store);
    } else { // Else re-render item
        var containerId = "product-" + itemName;
        var container = document.getElementById(containerId);

        // render container for itemName 
        renderProduct(container, store, itemName);
    }
    
    var modalContent = document.getElementById("modal-content");
    renderCart(modalContent, this);
}


function showCart(cart) {
    var modal = document.getElementById('modal');
    modal.style.visibility = "visible";
    //Use renderCart() to update div#modal-content
    var modalContent = document.getElementById("modal-content");
    renderCart(modalContent, store);
    resetTimeCount();
}


function resetTimeCount() {
    // Reset the time counter when uwer perform any action
    inactiveTime = 0;
}

function inactivityTracker() {
    // Time tracker update every second
    if (inactiveTime < 30) {
        inactiveTime++;
    }
    else{
        //If the user does not perform any action within 30 seconds
        alert("Hey there! Are you still planning to buy something?");
        resetTimeCount();
    }
}

function renderCart(container, storeInstance) {
    
    // Remove all element in container, prevent table duplication
    while(container.firstChild) {
        container.removeChild(container.firstChild);
    } 
    // Create new DOM table element 
    var outputTable = document.createElement("table");
    // The new DOM element replace the contents of container
    container.appendChild(outputTable);
    
    var totalPriceValue = 0;

    // Create table column feature name (Item, Quantity, Sub Price)
    var featureName = document.createElement("tr");

    // Create tableData object for cart item as column feature
    var itemColumn = document.createElement("td");
    itemColumn.setAttribute("class", "cart-column");
    itemColumn.textContent = "Item";
    featureName.appendChild(itemColumn);

    // Create tableData object for quantity as column feature
    var quantityButtomColumn = document.createElement("td");
    quantityButtomColumn.setAttribute("class", "cart-column");
    quantityButtomColumn.textContent = "Quantity";
    featureName.appendChild(quantityButtomColumn);
    
    // Create tableData object for sub-price as column feature
    var subPriceColumn = document.createElement("td");
    subPriceColumn.setAttribute("class", "cart-column");
    subPriceColumn.textContent = "Sub Price";
    featureName.appendChild(subPriceColumn);

    // Set attribute for CSS formatting 
    outputTable.setAttribute("id", "cartTable");
    // Append feature element to the output table
    outputTable.appendChild(featureName);
    
    // For each product in cart, generate entry by creating its own element
    for (var productInCart in storeInstance.cart) {
        // Create a TableRow Object that contains item name/quantity/sub-price feature
        var row = document.createElement("tr");
        outputTable.appendChild(row);

        // Create cart item name as TableData Object
        var tableItemName = document.createElement("td");
        tableItemName.textContent = productInCart;

        // Create cart item quantity and buttons as TableData Object 
        var quantity = storeInstance.cart[productInCart];
        var tableQuantity = quantityColumn(storeInstance, productInCart, quantity);
        
        // Create sub-total price as TableData Object 
        var tablePrice = document.createElement("td");
        var subTotalPrice = storeInstance.stock[productInCart].price * quantity;
        tablePrice.textContent = "$" + subTotalPrice;
        
        // Append all three (feature) elements to row element 
        row.appendChild(tableItemName);
        row.appendChild(tableQuantity);
        row.appendChild(tablePrice);

        // Calculate total price for the entire cart table
        totalPriceValue += subTotalPrice;
    }

    /* Create total price element as TableRow Object, which has two text column:
        price title and price value. 
    */
    var totalPrice = document.createElement("tr");
    // Create a text element for total price title
    var priceTitle = document.createElement("td");
    priceTitle.setAttribute("class", "cart-column");
    priceTitle.textContent = "Total Price:";
    totalPrice.appendChild(priceTitle);

    // Create a text element for total price value 
    var totalPriceValueText = document.createElement("td");
    totalPriceValueText.setAttribute("class", "cart-column");
    totalPriceValueText.textContent = "$" + totalPriceValue;
    totalPrice.appendChild(totalPriceValueText);

    // Set a line sperate total price and other rows
    totalPrice.setAttribute("id", "cartBorderLine");
    
    cartTable.appendChild(totalPrice);
}

/*  Function: Create tableData object for quantity column, The table should also 
    have "+" and "-" <button>s for each item, which can be clicked to 
    increment/decrement the quantity.
*/
function quantityColumn(storeInstance, productInCart, quantity) {
    var tableQuantity = document.createElement("td");  
    var quantityText = document.createTextNode(quantity);
    tableQuantity.appendChild(quantityText);

    // Create increment buttons 
    var addButtom = document.createElement("button");
    var addSign = document.createTextNode("+");
    addButtom.setAttribute("class", "quantityButtom");
    addButtom.appendChild(addSign);
    // Add eventlistener, invoke the addItemToCart methods
    addButtom.addEventListener("click", function () { storeInstance.addItemToCart(productInCart) }, false);
    tableQuantity.appendChild(addButtom);

    // Create decrement buttons
    var decButton = document.createElement("button");
    var decSign = document.createTextNode("-");
    decButton.setAttribute("class", "quantityButtom");
    decButton.appendChild(decSign); 
    // Add eventlistener, invoke the removeItemFromCart methods
    decButton.addEventListener("click", function () { storeInstance.removeItemFromCart(productInCart) }, false)
    tableQuantity.appendChild(decButton);

    return tableQuantity;
}

// Invoke when button #btn-hide-cart is clicked. To make div#modal invisible
var hideCart = function () {
    resetTimeCount();
    var modal = document.getElementById("modal");
    //Make div#modal invisible
    modal.style.visibility = "hidden";
}

// Hide cart when escape key is pressed
function keyEvent(inputkey) {
    if(inputkey.keyCode == 27){
        // The ASCII code of Escape key is 27.
        hideCart();
    }
}
window.addEventListener("keydown", keyEvent, false);

window.onload = function() {
    // Initiate the time tracker
    setInterval(inactivityTracker, 1000);
    productView = document.getElementById("productView");
    this.renderProductList(productView, store);
}


var checkOut = function () {
    resetTimeCount();
    var checkOutBtn = document.getElementById("btn-check-out");
    // disable the button to prevent multiple clicks
    checkOutBtn.disabled = true;
    store.checkOut(function () {
        // Re-enable the button in the callback function.
        checkOutBtn.disabled = false;
    });
    
}