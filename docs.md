# Main strategy object
A strategy object has a few main functions:

- `__init__(turbo)`
    - `turbo` will be used to get information on the `expiry`, `deadtime`, etc
    - object is in the form of `{ id, name, deadtime, expiry }`
- `insertData(tstamp, data)`
- `makeGuess(tstamp, data)`
    - `tstamp` is curr time, `data` is current data value
    - `deadtime` is the non-buy time, obtained from `turbo`
    - `expiry` is the time for each frame, obtained from `turbo`
    - returns `{ dir: -1|1|0, exp: <timestamp for option expiry> }` else `null`
- `checkGuess(tstamp, data)`
- `getStats()`: return `{right, wrong}`

## Implementation using candles
A strategy object may be supported with a candle list. The strategy object just aims to encapsulate the indicators used and whatever data needed to determine whether to buy.

Each option is stored and when `checkGuess()` is called, the timestamp is checked, the payout is determined as soon as the timestamp is met. General strategy is to have unchecked options stored and checked for updates, then the stats updated.

Otherwise, it is possible to use other factors as well, like a normal distribution and such.

# Options handling
The options module encapsulates all the option making and creating processes.

- `__init__()`
- `makeGuess(data, tstamp, dir, expiry)`
    - `expiry` is the time per buy slot
    - returns option object too
- `checkGuess(tstamp, data)`:
    - returns `[option1, option2, ...]` to be used for logging
    - `option.data2` represents final data
    - `option.correct` will represent whether an option is right
        - `1` if direction guess correct, `-1` for wrong guess
        - `0` for no change
    - `option.padding` will be the amount of padding for history
    - `option.history` will be list of last `expiry+padding` values for `candle.close`
    - `option.position` buy position on `option.history`

## Option object
```
{
    dir: [1|-1],
    data: <curr data pt>,
    tstamp: <tstamp created>,
    exp: <tstamp to get checked>,
}
```

# Indicators with data
This is the modules used to implement indicators.

## CandleList
Each candle list is tied to `tframe` (time for each candle) and `windowSize` (this should be bigger than any of the indicator's windowSize).

- `__init__(tframe, windowSize)`
- `insert(tstamp, data)` insert data into candles array, create new candle if needed
- `getLastCandle(last=0)` get last-th candle, used for indicators
- `getTstampId()` returns the tstamp id, used for indicator functions

### Candles
Each of the candle support the following:

- `open`, `close`
- `low`, `high`
- `getAvg()`, `getDirection()`

### Dataline
This is a special instance of the candle stick. Each candle is only one second and it is generally used for logging out the relevant charts when storing the results of the option, and has the following function.

- `__init__(expiry)`: sets the history to `2*expiry`
- `getData(padding=0)`
    - returns the past `padding + expiry` data
    - based on `candle.close`

## Indicator object
All indicator functions must have the following functions:

- `__init__(candles)`: candles is the default list of candle to calculate from
- `getLastVal(last)`: return the last-th value of the chart
- `getLastDirection(last)`: return `1` increase, `-1` decrease, `0` constant

### Indicator utilities
These are functions implemented for indicator comparison:

- `hasLastCross(indicator1, indicator2, range)`: `true` if crossed, check till range-th
- `getLastPosition(indicator1, indicator2, last)`: `1` for `indicator1 < indicator2`, `-1` for `indicator1 > indicator2`, `0` for `indicator1 == indicator2`

# Actual Strategies
## strategyNorm
Stores movement predictions and checks expectation of it being a normal. Underlying the decision making process, lies a list of candle values, and their amount of change

### Base arrays
- `cdfMovement`: raw prediction based on trend, (<0, >0 evaluation)
- `actMovement`: actual movement of turbo
- `chkMovement`: see if movement has reverse trend, see `isReversed()`

The indexing mechanism is a windowing mechanism, values are written over and tracked using `idx`. The value of `idx` is incremented in `checkGuess()`, however due to the fact that this function may be run multiple times a segment, check is done to ensure that `idx` is not incremented multiple times.

### Functions
#### makeGuess(tstamp, deadtime, expiry)
`zcdf` is calculated as a sum of `tleft` number of normal variables with the mean and variance determined by the underlying list of candle values.

If `zcdf` falls in the margins prefined in `MARGIN`, a direction prediction is made. This is based on the normal distribution model defined in `listCandles` library.

This function stores the direction prediction in `cdfMovement`. When `index` calls this function, there is prior check to ensure that an option is not yet made. But in the case where this function is called multiple times in a segment, the `idx` doesn't change, so `cdfMovement[idx]` will be overwritten until `checkGuess()` is called.

#### checkGuess(tstamp, curr)
`diff` is the actual difference between the point the option is made and the current value of the turbo. The direction is determined, based on whether the change is postive or negative.

The actual movement is stored in `actMovement[idx]` and is checked again the prediction made in `cdfMovement[idx]`. The result is then stored in `chkMovement[idx]`.
