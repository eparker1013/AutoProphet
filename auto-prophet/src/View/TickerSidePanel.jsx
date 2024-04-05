// No Warranty
// This software is provided "as is" without any warranty of any kind, express or implied. This includes, but is not limited to, the warranties of merchantability, fitness for a particular purpose, and non-infringement.
//
// Disclaimer of Liability
// The authors of this software disclaim all liability for any damages, including incidental, consequential, special, or indirect damages, arising from the use or inability to use this software.

import React from "react";

function TickerSidePanel(props) {
    // Fetch latest data
    const dataLen = props.state.data.response.results[0]["data"].length;
    const todayData = props.state.data.response.results[0]["data"][dataLen - 1];

    return (
        <div>
            <h4>{props.state.secData.response.results[0]["data"]["entityName"]}</h4>
            <p>CIK: {props.state.secData.response.results[0]["cik"]}</p>
            <p>Revenues: {props.state.secData.response.results[0]["data"]["facts"]["us-gaap"]["Revenues"]["units"]["USD"][0]["val"]}</p>
            <p>Price: {todayData.price}</p>
            <p>Volume: {todayData.volume}</p>
            <p>(as of {todayData.date} {todayData.time})</p>
        </div>
    );
}

export { TickerSidePanel }