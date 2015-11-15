// Helper functions
    // Parse a page id from the hash value
    function getActivePageId () {
        var h = window.location.hash;
        for (var i = 0; i < accounts.length; i++) {
            if (h.search(accounts[i].name) !== -1) return accounts[i].name;
        }

    // default to the accounts page
        return defaultActivePageId;
    }

    // format a number/string as currency
    function formatCurrency (value) {
    // add $, commas and decimal
    // solution borrowed from Tom: http://stackoverflow.com/questions/14467433/currency-formatting-in-javascript#answer-14467460
        var string = '$' + parseFloat(value).toFixed(2).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");

    // get the negative sign before the dollar sign
        if (string.substring(1, 2) == '-') return "-" + string.replace('-', '');
        else return string
    }

    // format date for display
    function formatDate (date) {
    // convert date object to date MM/DD/YYYY format
        var month = date.getMonth()+1;
        if (month < 10) month = "0"+month;
        return month+"/"+date.getDate()+"/"+date.getFullYear();
    }
    // format date for machine
    function formatDateISO (date) {
    // convert date object to ISO string for datetime property
        return date.toISOString();
    }

    // polyfill for object.assign
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign#Polyfill
    if (!Object.assign) {
        Object.defineProperty(Object, 'assign', {
          enumerable: false,
          configurable: true,
          writable: true,
          value: function(target) {
            'use strict';
            if (target === undefined || target === null) {
              throw new TypeError('Cannot convert first argument to object');
            }

            var to = Object(target);
            for (var i = 1; i < arguments.length; i++) {
              var nextSource = arguments[i];
              if (nextSource === undefined || nextSource === null) {
                continue;
              }
              nextSource = Object(nextSource);

              var keysArray = Object.keys(nextSource);
              for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++) {
                var nextKey = keysArray[nextIndex];
                var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
                if (desc !== undefined && desc.enumerable) {
                  to[nextKey] = nextSource[nextKey];
                }
              }
            }
            return to;
          }
        });
      }
// Navigation handler
    function hashChangeHandler () {
    // read the hash value and parse a page id of it
        var id = getActivePageId();

    // update app state with it
        store.dispatch(changeHash(id));
    }

// Redux actions
    function changeHash(id) {
        return {
            type: "CHANGE_HASH",
            id: id
        }
    }

    function addTransaction(transaction, balance, account) {
        return {
            type: "ADD_TRANSACTION",
            payload: {
                transaction: transaction,
                balance: balance,
                account: account
            }
        }
    }

// redux reducer
    function bankApp(state, action) {
        switch(action.type) {
            case "CHANGE_HASH":
                return Object.assign({}, state, {
                    activePageId: action.id
                });
            case "ADD_TRANSACTION":
            // get a ref to the account
                for (var i = 0; i < state.accounts.length; i++) {
                    if (state.accounts[i].name == action.payload.account) {
                        var accountIndex = i;
                        break;
                    }
                }

            // is something wrong?
                if (accountIndex == undefined)  {
                    console.error("could not determine account for transaction");
                    return state;
                }

            // clone the state
                var newState = JSON.parse(JSON.stringify(state));

            // add the new transaction
                newState.accounts[accountIndex].transactions.unshift(action.payload.transaction);

            // update account balance
                newState.accounts[accountIndex].balance = action.payload.balance;

                return newState;
            default:
                return state;
        }
    }

// Render the UI when ready
    $(document).on('ready', function () {
    // init redux state store
        //const logger = reduxLogger.createLogger();
        //const createStoreWithMiddleware = reduxLogger.applyMiddleware(thunk, promise, logger)(Redux.createStore);
        //window.store = createStoreWithMiddleware(reducer, {activePageId: getActivePageId(), accounts: accounts});
        window.store = Redux.createStore(bankApp, {activePageId: getActivePageId(), accounts: accounts});

        // redraws Mitrhil whenever an action is dispatched
        store.subscribe(function () {
          console.log('happening');
          m.redraw.strategy('all');
          m.redraw(true);
        });

    // Render React
        // content
        m.mount(
          document.getElementById('content'),
          m.component(App, store.getState())
        );

        // nav
        m.mount(
            document.getElementById('navContainer'),
            m.component(Nav, store.getState())
        );

    // Listen for hashChanges
        $(window).on('hashchange', hashChangeHandler);
    });
