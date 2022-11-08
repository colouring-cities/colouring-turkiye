import React from 'react';

import './conservation-switcher.css';

interface ConservationAreaSwitcherProps {
    currentDisplay: string;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

const ConservationAreaSwitcherProps: React.FC<ConservationAreaSwitcherProps> = (props) => (
    <form className={`conservation-switcher ${props.currentDisplay}`} onSubmit={props.onSubmit}>
        <button className="btn btn-outline btn-outline-dark"
            type="submit">
            Switch conservation area overlay ({(props.currentDisplay === 'enabled')? 'Enabled' : 'Disabled'})
        </button>
    </form>
);

export default ConservationAreaSwitcherProps;
