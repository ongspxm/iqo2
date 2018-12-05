# IQO2

## Setting it up
`.env` should have the following parameters:

- `SSID`: ssid obtained from iqo platform login
    - `SSID` is the key that iqOption uses for authentication. You can get it from the console using the following command: `console.log(document.cookie.split('ssid=')[1].split(';')[0]);`.

## Actual buying
The current implementation does not take into account the actual buying of the options on iqOption. The function is implemented as `buyOption(turbo, option)`. Once you have decided to go ahead with a certain strategy, the `buyOption` is always available for you, just enable it.
