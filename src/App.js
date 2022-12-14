import 'regenerator-runtime/runtime'
import React from 'react'
import {login, logout} from './utils'
import './global.css'

import getConfig from './config'
import {BN} from 'bn.js'


const {networkId} = getConfig(process.env.NODE_ENV || 'development');

function convertToYoctoNear(amount) {
    return new BN(Math.round(amount * 100000000)).mul(new BN("10000000000000000")).toString();
}

export default function App() {
    // use React Hooks to store greeting in component state
    const [accounts, setAccounts] = React.useState();
    const [total, setTotal] = React.useState();

    // when the user has not yet interacted with the form, disable the button
    const [buttonDisabled, setButtonDisabled] = React.useState(true)

    // after submitting the form, we want to show Notification
    const [showNotification, setShowNotification] = React.useState(false)

    // The useEffect hook can be used to fire side-effects during render
    // Learn more: https://reactjs.org/docs/hooks-intro.html
    React.useEffect(
        () => {
            // in this case, we only care to query the contract when signed in
            if (window.walletConnection.isSignedIn()) {

            }
        },

        // The second argument to useEffect tells React when to re-run the effect
        // Use an empty array to specify "only run on first render"
        // This works because signing into NEAR Wallet reloads the page
        []
    )

    // if not signed in, return early with sign-in prompt
    if (!window.walletConnection.isSignedIn()) {
        return (
            <main>
                <h1>Welcome to NEAR!</h1>
                <p>
                    To make use of the NEAR blockchain, you need to sign in. The button
                    below will sign you in using NEAR Wallet.
                </p>
                <p>
                    By default, when your app runs in "development" mode, it connects
                    to a test network ("testnet") wallet. This works just like the main
                    network ("mainnet") wallet, but the NEAR Tokens on testnet aren't
                    convertible to other currencies ??? they're just for testing!
                </p>
                <p>
                    Go ahead and click the button below to try it out:
                </p>
                <p style={{textAlign: 'center', marginTop: '2.5em'}}>
                    <button onClick={login}>Sign in</button>
                </p>
            </main>
        )
    }

    const parseAccounts = function (input) {
        const pattern = RegExp(/([\_\-0-9a-zA-Z.]*)[\t,|\||=| ]?([0-9\.]+)/, 'g');
        const accounts = {};
        let result;
        let total = 0;
        while (result = pattern.exec(input)) {

            const recipient = result[1];
            const amount = Number(result[2]);
            if (recipient && amount) {

                if (accounts.hasOwnProperty(recipient)) {
                    accounts[recipient] += amount;
                } else {
                    accounts[recipient] = amount;
                }

                total += amount;
            }
        }

        setTotal(total);
        setAccounts(accounts);
        setButtonDisabled(false);

    };


    return (
        // use React Fragment, <>, to avoid wrapping elements in unnecessary divs
        <>
            <button className="link" style={{float: 'right'}} onClick={logout}>
                Sign out
            </button>
            <main>
                <h1>
                    <label
                        htmlFor="recipients"
                        style={{
                            color: 'var(--secondary)',
                        }}
                    >
                        Testnet Multi-Sender-App
                    </label>
                    {' '/* React trims whitespace around tags; insert literal space character when needed */}
                    @{window.accountId}
                </h1>
                <form onSubmit={async event => {
                    event.preventDefault()

                    // get elements from the form using their id attribute
                    const {fieldset, recipients} = event.target.elements

                    // disable the form while the value gets updated on-chain
                    fieldset.disabled = true

                    try {

                        let operations = Object.keys(accounts).reduce((newAccounts, recipient) => {
                            newAccounts.push({account_id: recipient, amount: convertToYoctoNear(accounts[recipient])});
                            return newAccounts;
                        }, []);

                        // make an update call to the smart contract
                        await window.contract.send({
                            // pass the value that the user entered in the greeting field
                            operations: operations
                        }, 300000000000000, convertToYoctoNear(total))
                    } catch (e) {
                        alert(
                            'Something went wrong! ' +
                            'Maybe you need to sign out and back in? ' +
                            'Check your browser console for more info.'
                        )
                        throw e
                    } finally {
                        // re-enable the form, whether the call succeeded or failed
                        fieldset.disabled = false
                    }

                    // show Notification
                    setShowNotification(true)

                    // remove Notification again after css animation completes
                    // this allows it to be shown again next time the form is submitted
                    setTimeout(() => {
                        setShowNotification(false)
                    }, 11000)
                }}>
                    <fieldset id="fieldset">
                        <label
                            htmlFor="recipients"
                            style={{
                                display: 'block',
                                color: 'var(--gray)',
                                marginBottom: '0.5em'
                            }}
                        >
                            Send tokens to multiple accounts by one transaction:
                        </label>
                        <div style={{display: 'flex'}}>
              <textarea
                  id="recipients"
                  rows={10}
                  onChange={e => parseAccounts(e.target.value)}
                  style={{flex: 1}}
              />
                            <button
                                disabled={buttonDisabled}
                                style={{borderRadius: '0 5px 5px 0'}}
                            >
                                Send
                            </button>
                        </div>
                        <span
                            style={{
                                display: 'block',
                                color: 'var(--gray)',
                                marginBottom: '0.5em',
                                marginTop: '0.5em'
                            }}
                        >
                            Send a Near tokens to multiple accounts at the one transaction, put it one line - one account amout pair,
                            separate account and amount with the blank space:<br /><br />
                            account1 10<br />
                            account2 30<br />
                            account3 40<br />
                        </span>
                    </fieldset>
                </form>
                <hr/>
                Join Our Telegram Chat: @openwebdev
                <hr/>
                <p>
                    To keep learning, check out <a target="_blank" rel="noreferrer" href="https://docs.near.org">the
                    NEAR docs</a> or look through some <a target="_blank" rel="noreferrer"
                                                          href="https://examples.near.org">example apps</a>.
                </p>
            </main>
            {showNotification && <Notification/>}
        </>
    )
}

// this component gets rendered by App after the form is submitted
function Notification() {
    const urlPrefix = `https://explorer.${networkId}.near.org/accounts`
    return (
        <aside>
            <a target="_blank" rel="noreferrer" href={`${urlPrefix}/${window.accountId}`}>
                {window.accountId}
            </a>
            {' '/* React trims whitespace around tags; insert literal space character when needed */}
            called method: 'set_greeting' in contract:
            {' '}
            <a target="_blank" rel="noreferrer" href={`${urlPrefix}/${window.contract.contractId}`}>
                {window.contract.contractId}
            </a>
            <footer>
                <div>??? Succeeded</div>
                <div>Just now</div>
            </footer>
        </aside>
    )
}
