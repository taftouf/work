import React from "react";
import { useRef, useState, useEffect } from "react";


class TrackClick extends React.Component {
    
    onClick = (original, e) => {
        original && original(e);
        console.log(`[track] ${this.props.eventName} ${this.props.ref}`);
    };

  
    render() {
        return React.Children.map(this.props.children, c =>
            React.cloneElement(c, {
            onClick: this.onClick.bind(c, c.props.onClick)
            })
        );
    }
}

export default TrackClick;