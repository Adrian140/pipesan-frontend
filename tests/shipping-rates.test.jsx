import React from 'react';
import { it,expect } from 'vitest';
import { render,screen,fireEvent } from '@testing-library/react';
import { getShippingQuote } from '../src/data/chronopostRates';
import ShippingRates from '../src/components/services/ShippingRates';
it('prices Chronopost bands with the 20% markup',()=>{expect(getShippingQuote('DE',1).price).toBe(9.62);expect(getShippingQuote('DE',1.01).price).toBe(10.15);expect(getShippingQuote('FR',0.5,'c18').price).toBe(8.44);expect(getShippingQuote('FR',0.2,'relais').price).toBe(5.66);});
it('adds the UK and Switzerland surcharges',()=>{expect(getShippingQuote('GB',0.3).price).toBe(16.15);expect(getShippingQuote('CH',30).price).toBe(70.85);});
it('refuses weights a service does not carry',()=>{expect(getShippingQuote('FR',21,'relais').price).toBeNull();expect(getShippingQuote('RO',201).price).toBeNull();expect(getShippingQuote('RO',0)).toBeNull();expect(getShippingQuote('US',1)).toBeNull();});
it('calculator follows the chosen country and weight',()=>{render(<ShippingRates/>);fireEvent.change(screen.getByLabelText('Destination country'),{target:{value:'DE'}});fireEvent.change(screen.getByLabelText('Parcel weight (kg)'),{target:{value:'1'}});expect(screen.getByTestId('shipping-quote').textContent).toBe('€9.62');expect(screen.queryByLabelText('Service')).toBeNull();});
