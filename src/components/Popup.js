import React, { useState } from "react";
import "./Popup.css";
import { ethers } from 'ethers';


function Popup(props) {
    const [label, setLabel] = useState('');
    const [amount, setAmount] = useState('');
    const [to, setTo] = useState('');
    const [interval, setInterval] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const contract = props.contract;

    function handleInputChange(e) {
        if (e.target.placeholder == "label") {
            setLabel(e.target.value);
        }
        if (e.target.placeholder == "to") {
            setTo(e.target.value);
        }
        if (e.target.placeholder == "amount") {
            setAmount(e.target.value);
        }
        if (e.target.placeholder == "interval") {
            setInterval(e.target.value);
        }

        if (errorMessage) {
            setErrorMessage('');
        }
    }


    async function handleActionButton(setTrigger, action) {
        if (!errorMessage) {
            if (action == "Create") {
                if(to != "" && interval != "" && amount != "") {
                    try {
                        await contract.createPayment(to, label, ethers.utils.parseEther(amount), interval, {from: props.account});
                    } catch(e) {
                        let revert_reason = e.message.substring(e.message.indexOf("execution reverted").toString(), e.message.indexOf("\",").toString());
                        setErrorMessage(revert_reason);
                    }
                }
            }
    
            if (action == "Fund") {
    
            }
    
            if (action == "Withdraw") {
                
            }
    
        }
    }
    


    return (props.trigger && (props.paymentId || props.button == "Create")) ? (
        <div className="popup">
            <div className="popup-inner">
                <div className="popup-title">
                    {props.title}
                </div>
                <div className="popup-inputs">
                    {props.inputs.map(function(item, i){
                        return <div key={i}>
                            <label>{item}:</label>
                            <input type="text" placeholder={item} onChange={handleInputChange}></input>
                        </div>
                    })}
                </div>
                <br />
                <button className="action-button" onClick={() => handleActionButton(props.setTrigger, props.button)}>{props.button}</button>
                <button className="exit-button" onClick={() => props.setTrigger(false)}>X</button>
                {errorMessage && <div>{errorMessage}</div>}
            </div>
        </div>
    ) :
    "";
}

export default Popup;