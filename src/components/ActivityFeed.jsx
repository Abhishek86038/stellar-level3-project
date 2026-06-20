import React, { useState, useEffect } from 'react';
import { listenForPaymentEvents } from '../paymentContract';
import { scValToNative } from '@stellar/stellar-sdk';

const ActivityFeed = () => {
    const [events, setEvents] = useState([]);

    useEffect(() => {
        listenForPaymentEvents((event) => {
            try {
                if (event.type !== 'contract') return;

                const sender = scValToNative(event.topic[1]);
                const receiver = scValToNative(event.topic[2]);
                const amount = scValToNative(event.value);

                setEvents((prevEvents) => {
                    const newEvent = {
                        id: event.id,
                        sender: sender,
                        receiver: receiver,
                        amount: Number(amount)
                    };
                    // Ensure uniqueness
                    if (prevEvents.find(e => e.id === newEvent.id)) {
                        return prevEvents;
                    }
                    return [newEvent, ...prevEvents].slice(0, 50);
                });
            } catch (err) {
                console.error("Error parsing event:", err);
            }
        });
    }, []);

    return (
        <div className="activity-feed">
            <h3>Live Activity Feed</h3>
            {events.length === 0 ? (
                <p className="no-events">Waiting for events...</p>
            ) : (
                <ul className="event-list">
                    {events.map((evt) => (
                        <li key={evt.id} className="event-item">
                            <div className="event-details">
                                <span className="event-address" title={evt.sender}>
                                    {evt.sender.substring(0, 4)}...{evt.sender.substring(evt.sender.length - 4)}
                                </span>
                                <span className="event-arrow">→</span>
                                <span className="event-address" title={evt.receiver}>
                                    {evt.receiver.substring(0, 4)}...{evt.receiver.substring(evt.receiver.length - 4)}
                                </span>
                            </div>
                            <span className="event-amount">{evt.amount} XLM</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default ActivityFeed;
