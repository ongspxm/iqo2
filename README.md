# IQO2

## Setting it up
`.env` should have the following parameters:

- `SSID`: ssid obtained from iqo platform login
    - `SSID` is the key that iqOption uses for authentication. You can get it from the console using the following command: `console.log(document.cookie.split('ssid=')[1].split(';')[0]);`.

### The step by step version
1. Go on to your iqo account, and run the following script in the console: `console.log(document.cookie.split('ssid=')[1].split(';')[0]);` This will give you the ssid you require for the scripts
1. Clone this repo
1. create a file `.env` in the root directory
1. Install required dependency: `npm install`
1. Run the following command `echo "SSID from iqo" > .env`
1. Start the script with `node index.js`

Different logging information will be printed out, depending on the algorithm that you run. The default algorithm (not gonna be great) runs on all active turbo options, and you can see when the algorithm picks and decides to buy an option.

The full documentation of the different tools implemented in this project is available at docs.md

## Actual buying
The current implementation does not take into account the actual buying of the options on iqOption. The function is implemented as `buyOption(turbo, option)`. Once you have decided to go ahead with a certain strategy, the `buyOption` is always available for you, just enable it.

## How it all started
Copy of the blog post from [here](https://ongspxm.github.io/blog/2018/12/project-iqo2/).

So I was sitting in my stats lecture one day. It was an introductory module and the prof was going on about how normal distribution is one of the most common distributions out there.

Then he raised some examples, grades for students, length of factory manufactured products with some margin or error.

Then he casually mentioned, in the stock market, you can analyze the information and treat it as a normal distribution. It can increase and decrease by a mean amount, the magnitude of change has a certain variance too.

I thought about it. Hey, I could do that, let's see if that works. So I went searching for a programmable platform for me to get ticker information. There was MetaTrader, with the many different sources, but that seemed like overkill.

Then I found [iqOption](https://iqoption.com/traderoom/), there were a few old libraries for it, they didn't seem to be maintained. Plus, to do the normal distribution idea, I need to be able to capture the raw information and do the calculations myself. Those libraries don't look like they support those.

This triggered the web developer in me. And I dug, and I found that iqOption, the web interface, use WebSockets to retrieve the data. I started working on the socket frames. Looks simple enough to work with.

A simple project that was supposed to be completed over a weekend turned into a month-long development project. After so much refactoring and organizing and shifting components around. A workable system is built.

The iqo2 system is written in nodejs. The choice in language is due to the event-driven nature of the project. This iqo2 system is meant for developers who know their way around code. Most of the components are written in such that it is possible to extend.

It can support new indicators, you can write strategies that use those indicators. There is a default candlestick list that does all the data congregation.

Well, the normal distribution thing didn't turn out to be such a great idea. It didn't really work, it is almost like a random choice.

But with this piece of code, you can fork and build upon it. Well, I may not have earned big bucks from this project, but I shouldn't let it go to waste.

If ever you built your trading system on this, and you earned some money, you can thank me by buying me [coffee](http://buymeacoff.ee/9ZQBHej).

