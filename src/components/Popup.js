import React from "react";
import "./Popup.css";

async function handleCloseButton(setTrigger, action) {
    if (action == "Create") {

    }

    if (action == "Fund") {

    }

    if (action == "Withdraw") {
        
    }

    setTrigger(false);
}

function Popup(props) {
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
                            <input type="text" placeholder={item}></input>
                        </div>
                    })}
                </div>
                <br />
                <button className="close-button" onClick={() => handleCloseButton(props.setTrigger, props.button)}>{props.button}</button>
            </div>
        </div>
    ) :
    "";
}

export default Popup;