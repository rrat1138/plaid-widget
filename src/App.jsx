import React, { useState, useEffect, useCallback } from "react";
import { usePlaidLink } from "react-plaid-link";
import "./App.scss";

function App(props) {
  const [token, setToken] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
const [processorToken, setProcessorToken] = useState(null); // add state variable for processorToken

  const onSuccess = useCallback(async (publicToken, metadata) => {
    setLoading(true);
    await fetch("/api/exchange_public_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ public_token: publicToken }),
    });
await fetch("/api/create_processor_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ public_token: publicToken, account_id: metadata.accounts[0].id }),
  })
    .then((response) => response.json())
    .then((data) => {
      const processorToken = data.processor_token;
console.log("Token:", processorToken);
setProcessorToken(processorToken); // set the processorToken state variable

    })
    .catch((error) => {
      // handle error
    });

    await getBalance();
  }, []);

  // Creates a Link token
  const createLinkToken = React.useCallback(async () => {
    // For OAuth, use previously generated Link token
    if (window.location.href.includes("?oauth_state_id=")) {
      const linkToken = localStorage.getItem('link_token');
      setToken(linkToken);
    } else {
      const response = await fetch("/api/create_link_token", {});
      const data = await response.json();
      setToken(data.link_token);
      localStorage.setItem("link_token", data.link_token);
    }
  }, [setToken]);

  // Fetch balance data
  const getBalance = React.useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/balance", {});
    const data = await response.json();
    setData(data);
    setLoading(false);
  }, [setData, setLoading]);

  let isOauth = false;

  const config = {
    token,
    onSuccess,
  };

  // For OAuth, configure the received redirect URI
  if (window.location.href.includes("?oauth_state_id=")) {
    config.receivedRedirectUri = window.location.href;
    isOauth = true;
  }
  const { open, ready } = usePlaidLink(config);

  useEffect(() => {
    if (token == null) {
      createLinkToken();
    }
    if (isOauth && ready) {
      open();
    }
  }, [token, isOauth, ready, open]);


 const handleSubmit = async (e) => {
    e.preventDefault();

  const searchParams = new URLSearchParams(window.location.search);
  const userid = searchParams.get("userid");


    const formData = new FormData(e.target);
    const data = {};

    for (let [key, value] of formData.entries()) {
      data[key] = value;
    }
  data["userid"] = userid;

    await fetch("https://pzcoopmembersportal.kinsta.cloud/?wpwhreceivable_group=received_http_request&wpwhreceivable_name=wpwh-flow-30&wpwhreceivable=9nKDYUSw2xIxsMFlrUXk9VQ40zaeQ795G3ggYB73rAQ-", {
      method: "POST",
      body: JSON.stringify(data),
	mode: 'no-cors',
  });

    window.location.href = `https://pzcoopmembersportal.kinsta.cloud/`;
  };


return (
  <div id="main">

    {!loading && processorToken != null ? (
      <div id="congrats">
        <h4>Great! Your bank account is set.</h4>
{!loading && data != null && (
          <div>
            <p><strong>Available Balance:</strong> ${data.Balance.accounts[0].balances.available}</p>
            <p><strong>Bank:</strong> {data.Balance.accounts[0].name}</p>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <input type="hidden" name="token" value={processorToken} />
          <input type="hidden" name="bankname" value={data.Balance.accounts[0].name} />
          <input type="hidden" name="balance" value={data.Balance.accounts[0].balances.available} />
          <button type="submit">Continue</button>
        </form>

      </div>
    ) : (
<div>
<h4>Let's connect your bank account, click the button below to get started:</h4>
      <button onClick={() => open()} disabled={!ready}>
        <strong>Link account</strong>
      </button>
</div>
    )}
  </div>
);
}

export default App;