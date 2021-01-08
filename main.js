// load libraries
const { Telegraf } = require('telegraf');
const { MenuTemplate, MenuMiddleware } = require('telegraf-inline-menu');
const fetch = require('node-fetch');
const withQuery = require('with-query').default;
require('dotenv').config();

// functions
const fetchGifs = (keyword, ctx) => {
    const apiKey = process.env.GP_KEY;
    const limit = 3;
    const url = withQuery('https://api.giphy.com/v1/gifs/search', {
        'api_key': apiKey,
        q: keyword,
        limit
    });
    
    return fetch(url)
        .then(resp => resp.json())
        .then(data => {
            const result = data['data'];
            if(result.length > 0) {
                return result.forEach(r => ctx.replyWithVideo(r['images']['fixed_height']['url']));
            } else {
                return ctx.reply(`Sorry, no result. No worry, please try again with other ideas.`);
            }
        })
        .catch(error => console.error(error));
};

// create a menu
const menu = new MenuTemplate(() => 'Some examples for you:');
// add buttons to menu
menu.interact('Happy New Year 2021', 'happy new year 2021', {
    do: ctx => ctx.answerCbQuery('happy new year 2021').then(() => true)
});
menu.interact('Demon Slayer', 'demon slayer', {
    do: ctx => ctx.answerCbQuery('demon slayer').then(() => true)
});
menu.interact('Donald Trump', 'trump', {
    do: ctx => ctx.answerCbQuery('trump').then(() => true),
    joinLastRow: true
});

// create a bot
const bot = new Telegraf(process.env.TG_TOKEN);

// when a user starts a session with bot
bot.start(ctx => {
    ctx.replyWithPhoto({ source: './nezuko.png'});
    ctx.reply('Welcome to FSD Bot!');
    ctx.reply('Say "hi" to start an interesting journey with us!');
});

// listen to message
bot.hears('hi', ctx => {
    ctx.reply(`Hello there! Please try our commands:\n/gifs`);
});

// middleware
const menuMW = new MenuMiddleware('/', menu);

bot.use((ctx, next) => {
    if(ctx.callbackQuery != null) {
        const keyword = ctx.callbackQuery.data.substring(1);
        return fetchGifs(keyword, ctx);
    }
    next();
});

// listen to command
bot.command('news', ctx => {
    // console.info('Message: ', ctx.message);
    const country = ctx.message.text.split(' ')[1] || '';
    ctx.reply(`So you want news from ${country}?`);
});

bot.command('gifs', ctx => {
    if(ctx.message.text === '/gifs') {
        ctx.reply(`Some interesting gifs? Give me some ideas!\nFor example:\n/gifs happy new year 2021\n/gifs demon slayer`);
        return menuMW.replyToContext(ctx);
    } else {
        const keyword = ctx.message.text.substring(6);
        return fetchGifs(keyword, ctx);
    }   
});

// catch unexpected error
bot.catch((err, ctx) => {
    console.error(`Ooops, encounterd an error for ${ctx.updateType}`, err);
});

// start the bot
bot.launch();
console.info(`[INFO] Bot started running at ${new Date()}`);