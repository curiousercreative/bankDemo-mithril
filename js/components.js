var App = {
    controller: function (args) {
      //this.state = args.getState();
      //this.activePageId = state.activePageId;
      //this.accounts = state.accounts;
    },
    view: function (ctrl, args) {
        var state = args.getState();

        return m('div',
            [
                m.component(
                  AccountOverview,
                  {id: "accounts", accounts: state.accounts, activePageId: state.activePageId}
                ),
                state.accounts.map(function (account) {
                  return m.component(Account, {activePageId: state.activePageId, account: account});
                })
            ]
        )
    }
};

var AccountOverview = {
    controller: function (args) {
        this.activePage = function (activePageId, id) {
          return activePageId == id ? '.active' : '';
        };
    },
    view: function (ctrl, args) {
        return m('div#'+args.id+'.page'+ctrl.activePage(args.activePageId, args.id),
            m('table.table.table-bordered.table-condensed',
                [
                    m('thead',
                        m('tr',
                            [
                                m('th', 'Account'),
                                m('th', 'Balance')
                            ]
                        )
                    ),
                    m('tbody',
                        args.accounts.map(function (account, i) {
                            return m('tr',
                                [
                                    m('td.accountName',
                                        m('a', {href: '#/'+account.name}, account.name) // make dynamic
                                    ),
                                    m('td.currency', formatCurrency(account.balance))
                                ]
                            );
                        })
                    )
                ]
            )
        );
    }
};

var Account = {
    controller: function (args) {
        this.activePage = function (activePageId, id) {
          return activePageId == id ? '.active' : '';
        };

        this.handleTransactionSubmit = function (transaction) {
        // calculate balance
            transaction.balance = parseFloat(args.account.balance) + parseFloat(transaction.amount);

        // update state
            store.dispatch(addTransaction(transaction, transaction.balance, args.account.name));
        }
    },
    view: function (ctrl, args) {
        var activePageId = store.getState().activePageId;
        return m('div#'+args.account.name+'.page'+ctrl.activePage(activePageId, args.account.name),
            [
                m('div.row',
                    [
                        m('h1.col-md-6.accountName', args.account.name),
                        m('div.col-md-6.text-center',
                            m('div.well.well-sm.accountBalance',
                                [
                                    m('span.h5', "Account Balance:"),
                                    m('strong.currency', formatCurrency(args.account.balance))
                                ]
                            )
                        )
                    ]
                ),
                m('h2.h3', 'Record new transaction'),
                m.component(TranasctionForm, {onTransactionSubmit: ctrl.handleTransactionSubmit}),
                m('h2.h3', 'Transaction history'),
                m.component(TransactionLedger, {balance: args.account.balance, transactions: args.account.transactions})
            ]
        )
    }
};

var Nav = {
    controller: function (args) {
      //var state = args.getState();
      //this.activePageId = state.activePageId;
      //this.accounts = state.accounts;

      this.isActive = function (activePageId, id) {
        console.log(activePageId);
        if (activePageId == id) return "active"
        // also match for the tab/dropdown item
        else if (
            activePageId !== defaultActivePageId
            && !id
        ) {
            return "active";
        }
        else return "";
      }

      this.clickHandler = function (e) {
        $(e.target).closest('li.dropdown').toggleClass("open");
      }
    },
    view: function (ctrl, args) {
        var state = args.getState();
        return (
            m('nav#primaryNav[role=tablist]',
              m('ul.nav.nav-tabs',
                [
                    m('li[role=presentation]', {className: ctrl.isActive(state.activePageId, "accounts")},
                      m('a[href=#/accounts][role=tab]', "Accounts overview")
                    ),
                    m('li[role=tab].dropdown', {className: ctrl.isActive(state.activePageId), onclick: ctrl.clickHandler},
                      [
                        m('a#nav-dropdown.dropdown-toggle[aria-expanded=false][aria-haspopup=true][type=button][role=button]',
                          [
                            m('span', 'Accounts'),
                            m('span',
                              [
                                m('span'),
                                m('span.caret')
                              ]
                            )
                          ]
                        ),
                        m('ul.dropdown-menu[role=menu]',
                          state.accounts.map(function (account) {
                            return (
                                m('li', {className: ctrl.isActive(state.activePageId, account.name)},
                                  m('a', {href: "#/"+account.name}, account.name)
                                )
                            )
                          })
                        )
                      ]
                    )
                ]
              )
            )
        )
    }
};

var TransactionLedger = {
    view: function (ctrl, args) {
        return (
            m('table#ledger.table.table-bordered',
                [
                    m('thead',
                        m('tr',
                            [
                                m('th', 'Date'),
                                m('th', 'Description'),
                                m('th.currency', 'Amount'),
                                m('th.currency', 'Balance')
                            ]
                        )
                    ),
                    m('tbody',
                        args.transactions.map(function (transaction) {
                            return (
                                m.component(Transaction, {
                                    date: transaction.date,
                                    amount: transaction.amount,
                                    description: transaction.description,
                                    balance: transaction.balance
                                })
                            );
                        })
                    )
                ]
            )
        );
    }
};

var Transaction = {
    controller: function (args) {
        this.getType = function (amount) {
            return parseFloat(amount) > 0 ? 'deposit' : ' withdrawal';
        }
    },
    view: function (ctrl, args) {
        return (
            m('tr', {className: 'transaction '+ctrl.getType(args.amount)},
                [
                    m('td', null,
                        m('time', {dateTime: formatDateISO(new Date(args.date))}, formatDate(new Date(args.date)))
                    ),
                    m('td', null, args.description),
                    m('td', {className: "currency"}, formatCurrency(args.amount)),
                    m('td', {className: "currency"}, formatCurrency(args.balance))
                ]
            )
        )
    }
};

var TranasctionForm = {
    controller: function (args) {
      this.submitHandler = function (e) {
          var transaction = {};

          e.preventDefault();

      // prep transaction object
          for (var i = 0; i < e.target.length; i++) {
            if (e.target[i].name) {
              transaction[e.target[i].name] = e.target[i].value;
            }
          }

          transaction.amount = transaction.sign + transaction.amount;
          transaction.date = Date.now();

      // pass off to parent
          args.onTransactionSubmit(transaction);

      // reset form
          e.target.reset();
      }
    },
    view: function (ctrl, args) {
        return (
          m('form', {onsubmit: ctrl.submitHandler},
            [
                m('.form-group.col-md-3',
                  [
                    m('label.control-label', 'Transaction type'),
                    m('select.form-control', {name: "sign", placeholder: 'select account', label: "Transaction type"},
                      [
                        m('option', {value: ''}, 'Deposit'),
                        m('option', {value: '-'}, 'Withdraw')
                      ]
                    )
                  ]
                ),
                m('.form-group.col-md-4',
                  [
                    m('label.control-label', 'Transaction amount'),
                    m('.input-group',
                      [
                        m('span.input-group-addon', '$'),
                        m('input.form-control', {name: "amount", placeholder: '10.00', label: "Transaction amount", type:"number", required:"true"})
                      ]
                    )
                  ]
                ),
                m('.form-group.col-md-5',
                  [
                    m('label.control-label', 'Transaction description'),
                    m('input.form-control', {name: "description", placeholder: 'enter description here', label: "Transaction description", type:"text", required:"true"})
                  ]
                ),
                m('.form-group.col-md-12.text-right',
                  m('input.btn.btn-primary.btn-default', {type:"submit", value:"submit"})
                )
            ]
        )
      )
    }
};
