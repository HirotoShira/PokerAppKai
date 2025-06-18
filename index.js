const express = require('express');  //const=型,let（再代入不可）も
const mongoose = require('mongoose');
const log = require('./models/log');
const event = require('./models/event');
const methodOverride = require('method-override');
const catchAsync = require('./utils/catchAsync');
const ExpressError = require('./utils/ExpressError');
const Joi = require('joi');

const dbUrl = 'mongodb://localhost:27017/pokerApp';
mongoose.connect(dbUrl,
    { 
        useNewUrlParser: true, 
        useUnifiedTopology: true, 
        useCreateIndex: true,//エラーを減らすため
        useFindAndModify: false 
    })
    .then(() => {
        console.log('MongoDBコネクションOK!');
    })
    .catch(err => {
        console.log('MongoDBコネクションエラー!!!');
        console.log(err);
    });

const app = express();
const path = require('path');

app.set('views', path.join(__dirname, 'views'));//
app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));
//POSTリクエストの本文（フォームの内容）を読み取るために必要。

app.use(methodOverride('_method'));//PUTを使用するために必要

app.use(express.static(path.join(__dirname,'views')));//CSS等静的ファイルの指定はStatic

app.get('/',(req,res)=>{// /=localhost:number
    res.render('home');
});//URLからページ取得


app.get('/platform', catchAsync(async (req,res)=>{
    const today = new Date(); // 今日
    const yesterday = new Date(today); // 複製してから変更
    yesterday.setDate(today.getDate() - 1); // 1日前に設定
    const nextMonth = new Date(today); // 元の日付をコピー
    nextMonth.setMonth(today.getMonth() + 1); // 1か月後に設定
    const events = await event.find({ eventDate: { $gte: yesterday, $lt: nextMonth } });
    //昨日から一か月後までのデータを取得
    const formattedDate = events.map(e => ({
        ...e._doc,
        formattedDate: new Date(e.eventDate).toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }));//日付の表示をきれいにする
    res.render('platform', { events, events: formattedDate }); 
    //formattedDate属性をeventsオブジェクトに追加
}));//URLからページ取得

app.get('/platform/addlog', (req,res)=>{
    res.render('addlog');
});

app.post('/platform/addlog', catchAsync(async (req, res) => {
    if(!req.body) throw new ExpressError('不正なデータです', 400);
    const { userNumber, date, point, reEntry, maxPot, event } = req.body;
    //フォームから入れた各データを変数に代入
    const totalPoint = Number(point) - Number(reEntry) * 200;//総得点の計算
    const bp = totalPoint - 200;//収支の計算
    const logEntry = new log({ userNumber, date, point, reEntry, maxPot, event, totalPoint, bp });
    //入れた変数からオブジェクトの生成
    await logEntry.save();//オブジェクトのセーブ
    res.redirect('/platform');
}));

app.get('/platform/individualRecord', catchAsync(async (req, res) => {//個人成績のルーティング
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1); // 今月1日
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1); // 来月1日
    const logData = await log.find({
        userNumber : "23aj071",
        date: { $gte: startOfMonth, $lt: startOfNextMonth }
    });//一か月間のデータを取得
    const zeroPointCount = await log.countDocuments({//ポイントが0のデータをカウント
    userNumber: "23aj071",
    point: 0,
    date: { $gte: startOfMonth, $lt: startOfNextMonth }
    });
    const totalReEntry = logData.reduce((sum, entry) => sum + entry.reEntry, 0);//リエントリーの合計
    console.log("今月のリエントリー数：", totalReEntry);
    const totalDeath = totalReEntry + zeroPointCount;
    console.log("今月のデス数：", totalDeath);
    const participantsNumber = logData.length;
    console.log("今月の参加日数：", participantsNumber);
    const totalPoints = logData.reduce((sum, entry) => sum + entry.totalPoint, 0);//得点の合計の計算
    console.log("今月の総得点:", totalPoints);
    const bps = logData.reduce((sum, entry) => sum + entry.bp, 0);
    console.log("今月の収支:", bps);
    res.render('individualRecord', { totalReEntry, totalDeath, participantsNumber, totalPoints, bps });
}));

app.get('/platform/event', catchAsync(async (req, res) => {
    const eventAll = await event.find({});
    console.log(eventAll);
    res.render('event', { eventAll });
}));

app.get('/platform/event/addEvent', (req, res) => {
    res.render('addEvent');
});

app.post('/platform/event/addEvent', catchAsync(async (req, res) => {
    if(!req.body) throw new ExpressError('不正なデータです', 400);
    const { eventName, eventDate, eventPlace, description } = req.body;
    //フォームから入れた各データを変数に代入
    const eventLog = new event({ eventName, eventDate, eventPlace, description });
    //入れた変数からオブジェクトの生成

    await eventLog.save();//オブジェクトのセーブ
    res.redirect('/platform/event');
}));

app.get('/platform/event/:id', catchAsync(async (req, res) => {
    const { id } = req.params;
    const foundEvent = await event.findById(id);
    res.render('show', { foundEvent });
}))

app.put('/platform/event/:id', catchAsync(async (req, res) => {
    const { id } = req.params;
    const { eventName, eventDate, eventPlace, description } = req.body;
    await event.findByIdAndUpdate(id, { eventName, eventDate, eventPlace, description });
    res.redirect(`/platform/event/${id}`);
}));

app.delete('/platform/event/:id', catchAsync(async (req, res) => {
    const { id } = req.params;
    await event.findByIdAndDelete(id);
    res.redirect('/platform/event');
}));

app.get('/platform/event/:id/edit', catchAsync(async (req, res) => {
    const { id } = req.params;
    const foundEvent = await event.findById(id);
    if (!foundEvent) {
        return res.status(404).send('イベントが見つかりませんでした。');
    }
    res.render('edit', { foundEvent });
}));

//app.get('/poker circle app',(req,res)=>{// /=localhost:number
//    res.render('home');
//});//URLからページ取得
//なにこれ？

app.all(/.*/, (req, res, next) => {
    //Express 5系から単独ワイルドカードは使用できなくなった。その代わりに/.*/を使用
    next(new ExpressError('ページが見つかりませんでした', 404));
});

app.use((err, req, res, next) => {
    const { statusCode = 500, message = '問題が起きました' } = err;
    res.status(statusCode).send(message);
});

app.listen(3500, () => {//Webサーバ立ち上げのおまじない 最後に置く
    console.log('ポート3500でリクエスト受付待ち中...');
});