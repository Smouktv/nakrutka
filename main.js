const vkp = require('VK-Promise'),
      low = require('lowdb'),
	    FileSync = require('lowdb/adapters/FileSync'),
      axios = require('axios');

const { proxy } = require("./proxy.js");

const glav        = 768957778//id главного админа
var   admid       = [1044448562] //id доп. админов через запятую
const token       = ""//токен бота
const channel     = "@VkNakrutkaBot" //канал бота с обновами
const useProxy    = false //true если использовать прокси для вк

admid.unshift(glav)
var proxyList = []
for (let p of proxy.split("\n")) {
  let pr = p.trim()
  proxyList.push(`https://${pr}`)
}

const t = new (require('node-telegram-bot-api'))(token, {
  polling: true
});

const groups = [
		"vkrussiavk",
		"vkstores",
		"vmuzzz",
  "rus_samp",
  "vzaimnoe___vstuplenie",
  "7x.prikol",
  "club94946045",
  "spottsila",
  "twi79",
  "dobav_like_repost_piar",
  "club148406719",
  "wormix_plus",
  "zbs_111",
  "laik_tamee",
  "go2friends",
  "club39130136",
  "club46258034",
  "add_me123",
  "cheesveshka",
  "vp_vkpub1",
  "dobav_menya_esli_xochesh",
  "club92431911",
  "spisokbezpodpisok",
  "followers_0",
]

const db = new FileSync('db.json'),
      lowdb = low(db),
      users = lowdb.get('users'),
      stoplist = lowdb.get('stop');

lowdb.defaults({
  users: [],
  stop: []
}).write();

for(let id of admid) {
  if (!users.find({id: id}).value())
    users.push({id: id, tokens: []}).write()
}


async function main(token, u) {
  let lim = u.limit ? u.limit : 2
  try {
    var group = (await getGroup(token, random(groups)))[0]
    var count = (await getMembers(token, group.id, 0)).count
    var out = (await getRequests(token)).items
    let offset = rand(0, (Math.round(count/1000)-1))*1000
    var members = (await getMembers(token, group.id, offset)).items.filter(val=> {
      return !out.includes(val)
    })
    var uses = (await getUsers(token, members.join(','), 'friend_status,last_seen,followers_count').catch(console.log)).filter(val => {
      return (val.followers_count != undefined && val.friend_status != undefined && val.last_seen != undefined && val.followers_count <= 5 && val.friend_status == 0 && val.last_seen.time > new Date().getTime()/1000-86400)
    })
    let ussr = []

    for (let gay of uses) {
      if(ussr.length >= lim)
        break
      let triplegay = (await getUsers(token, gay.id, 'counters,sex').catch(console.log))[0]
      if (!triplegay.counters || triplegay.counters.friends < 150)
        continue
      if(u.sex && triplegay.sex != u.sex)
        continue
      ussr.push(triplegay)
    }

    if(ussr.length == 0)
      return main(token, u)

    for (let uzhe of ussr) {
      addFriend(token, u, uzhe.id)
    }
  }
  catch (e) {
    return
  }
}

setInterval(async () => {
  console.log("________New________")
  for(let u of users.value()) {
    if(u.tokens.length == 0)
      continue
    for(let token of u.tokens) {
      us(u,token)
    }
  }
}, 300000);

async function us(u, token) {
  check(token, u.id)

  if(u.online)
    await request(token, "account.setOnline", {})
    async function abc(){
      let res = (await getRequests(token, 0)).items
      if(res)
        for (let i of res) {
          await request(token, "friends.add", {user_id: i})
        }
    }


  if(u.mode == 2 || u.mode == 3) {
    let grs = (await request(token, "groups.getById", {group_ids: groups.join(","), fields: "can_post"})).filter(val=>{
      return val.can_post != 0
    })
    for(let g of grs){
      await request(token, "wall.post", {owner_id: -g.id, message: u.text})
    }
  }
  if(!u.mode || u.mode == 3 || u.mode == 1) {
    main(token, u)
  }
  if(u.auto)
    abc()
}



t.getMe().then((res)=> {
  console.log(`Бот: @${res.username}\nID: ${res.id}\nНазвание: ${res.first_name}`);
  console.log(`Админы: ${glav} (главный), ${admid.slice(1).join(", ")}`)
});

var sessions = []

t.on('message', async (msg)=> {
  const uid = msg.from.id;
  const text = msg.text;
  var m = ""
  if(msg.text)
    m = text.toLowerCase();
  var adm = false
  var access = false

  if(sessions.includes(uid))
    return;

  if (msg.chat.id != uid)
    return;
  if (admid.includes(uid)){
    adm = true
  }
  if (users.find({id: uid}).value())
    access = true

  async function reply(text, id=uid, add={
    reply_markup: {
      keyboard: access ? [["id🆔", "Помощь🆘"], ["Добавить✅", "Удалить❌"],["Список📄", "Статистика📊"], ["Функции📋"], ["Капча📝", "Инфо💿"]] : [["id🆔", "Помощь🆘"], ["Инфо💿", "Цены💰"]],
      resize_keyboard: true
    }
  }) {
    await t.sendMessage(id, text, add);
  }

  function command(array, t=1, mm=m) {
    if (typeof array == 'string') var array = [array]
    for (let i of array) {
      if(t == 1)
        if (mm == i || mm == "/"+i)
          return true
      if(t == 2)
        if (mm.startsWith(i) || mm.startsWith("/"+i))
          return true
    }
    return false
  }

  function session(cmd){
    var end = false
    sessions.push(uid)
    t.on('message', m=>{
      if(uid != m.from.id || end)
        return
      if(m.text.toLowerCase() != "отмена") cmd(m)
      else reply("Операция отменена❌")
      sessions = sessions.filter(i => {return i != uid})
      end = true
    })
  }


  if(command(['start', 'help', 'помощь' , 'помощь🆘'])) {
    let text = ["Hi👍! Я - бот для накрутки друзей ВКонтакте!!!"];
	text.push("");
	text.push("Для покупки доступа и вопросов обращаться в тг: @SantaVs ");
	text.push("");
    text.push("Мои команды🕹:");
	text.push("1️⃣ Цены |- узнать цены ");
    text.push("2️⃣ Помощь |- список команд");
    text.push("3️⃣ id |- узнать ваш Telegram ID");
				text.push("4️⃣ Инфо |- информация");
    if(access) {
      text.push("5️⃣ Добавить |- добавить аккаунт в список накручиваемых")
      text.push("6️⃣ Удалить |- удалить токен из списка накручиваемых")
      text.push("7️⃣ Список |- список накручиваемых токенов")
      text.push("8️⃣ Статистика |- статистика накручеваемых аккаунтов")
      text.push("9️⃣ Капча |- добавить токен от RuCaptcha")
      text.push("🔟Функции |- все доступные вам функции")
    }
	if (adm)
      text.push("\n+user [Telegram id] - выдать права")
    text.push(`\nМы работаем ради вас:)  ${channel}`)
    reply(text.join("\n"));
  }

  if(command(['инфо💿', 'инфо'])) {
    reply("👤На данный момент создателем и владельцем бота являеться @SantaVs .\n💳Для покупки или вопросов обращаться к @SantaVs")
  }

  if(command(['цены', 'цена', 'цены💰'])) {
    reply("💯Доступ навсегда:70рублей.\n🅰️Админка:350рублей.\n🌐Скрипт бота:10000р.\n💳Для покупки обращаться в тг: @SantaVs ")
  }

  if(command("отмена")) {
    reply("Операция отменена❌")
  }

  if (command(['id', 'id🆔'])) {
    reply(`Твой Telegram ID: ${uid} ${adm ? '(🅰️АДМИНИСТРАТОР)' : access ? '(✅Есть доступ к накрутке)' : '(❌Нет доступа к накрутке)'}`)
  }

  if (!access)
    return;

  if (command(['add', 'добавить'], 2)) {
    async function add(token) {
      if(token.includes("access_token="))
        var token = token.split("access_token=")[1].split("&")[0]

      let toks = users.find({
        id: uid
      }).value().tokens;

      if(toks.includes(token))
        return reply('Этот токен уже в списке!❌')

      let vk = new vkp(token);

      try {
        let res = await vk.users.get()
        reply(`Добавлен токен пользователя ${res[0].first_name} ${res[0].last_name}`, uid);
      }
      catch(e){
        return reply('Этот токен не действителен!❌');
      }
      toks.push(token)
      users.find({
        id: uid
      }).assign({tokens: toks}).write();
    }

    let token = text.split(' ')[1]

    if(!token){
      session(async m => {
        await add(m.text)
      })
      return reply('📝Напишите ваш токен от ВК.\n🤳Токен можно получить тут: https://bit.ly/37tLHMs');
    }
    else
    await add(token)
  }

  if (command(['del', 'удалить'], 2)) {
    function del(token){
      let toks = users.find({
        id: uid
      }).value().tokens;
      if(!toks[token-1])
        return reply('Этого токена нет в списке!❌')

      let tokens = users.find({id: uid}).value().tokens.filter((val)=> {
        return val != toks[token-1];
      })

      users.find({id: uid}).assign({
        tokens: tokens
      }).write();

      reply(`Токен удалён❌`)
    }

    let token = ~~text.split(' ')[1]

    if(!token) {
      session(m => {
        del(~~m.text)
      })
      return reply('📝Напишите мне номер вашего токена (команда список)', uid, {
        reply_markup: {
          keyboard: [["Отмена"]],
          resize_keyboard: true
        }
      });
    }
    else
      del(token)
  }

  if (command(['captcha', 'капча'], 2)) {
    async function set(token) {
      if(token == "off") {
        users.find({
          id: uid
        }).assign({captcha: false}).write();
        return reply("RuCaptcha отключена!❌")
      }

      try {
        require('rucaptcha-client').create(token)
        users.find({
          id: uid
        }).assign({captcha: token}).write();
        reply("Установлен токен от RuCaptcha")
      }
      catch (e) {
        reply("Недействительный токен❌")
      }

    }


    let token = text.split(' ')[1]

    if(!token){
      session(async m => {
        await set(m.text.toLowerCase())
      })
      return reply('📝Напишите ваш токен от RuCaptcha или "off" для отключения RuCaptcha', uid, {
        reply_markup: {
          keyboard: [["Off"], ["Отмена"]],
          resize_keyboard: true
        }
      });
    }
    else{
      await set(token)
    }
  }

  if(command(['список', 'токены', 'list', 'tokens', 'список📄'])) {
    let u = users.find({id: uid}).value()
    let text = ["📋Ваши токены ВК:"]
    for (let token = 0; token < u.tokens.length; token++) {
      let a = await request(u.tokens[token], "users.get", {})
      text.push(`${token+1}. ${a[0].first_name} ${a[0].last_name}`);
    }

    reply(text.join('\n'))
  }

  if(command(['стат', 'статистика', 'стата', 'stat', 'статистика📊'])) {
    let u = users.find({id: uid}).value()
    reply("Готовим статистику⏩. Время зависит от количества подключенных токенов")
    let text = ["📊Статистика на ваших аккаунтах:"]
    for (let token of u.tokens) {
      let a = await request(token, "users.get", {fields: 'counters'})
      let b = await getRequests(token)
      text.push(`${a[0].first_name} ${a[0].last_name}${stoplist.find({token: token}).value() ? " (остановлен)" : ""}: \n${a[0].counters.friends} Друзей\n${a[0].counters.followers ? a[0].counters.followers : 0} Подписчиков\n${b.count} Исходящих заявок в друзья\n`);
    }
    reply(text.join('\n'))
  }

  if (command(['функции', 'настройки', 'настройка', 'функции📋'])) {
    reply("Выберите пункт:\n1️⃣ Удаление заявок - Удалить все исходящие заявки\n2️⃣ Автопринятие - Включение/Выключение автопринятия входящих заявок\n3️⃣ Лимит - Установка лимита заявок\n4️⃣ Режим работы - выбор режима работы бота\n5️⃣ Пол - Выбор особи какого пола будет кидать заявки бот\n6️⃣ Онлайн - включение/отключение вечного онлайна", uid, {
      reply_markup: {
        keyboard: [["🛠Режим работы"], ["⛔️Удаление заявок"],["✅Автопринятие"], ["♾Лимит"], ["🚻Пол"], ["⏳Онлайн"], ["Отмена"]],
        resize_keyboard: true
      }
    })

    session(s=> {
      let t = s.text.toLowerCase()

      if(command(["mode", "режим работы", "🛠режим работы"], 1, t)) {
        function set(mode){
          users.find({id: uid}).assign({mode: mode}).write()
          if(mode == 1)
            reply(`Установлен режим спама заявками`)
        }

        function text(mode) {
          set(mode)
          let u = users.find({id: uid}).value()
          session(tas => {
            users.find({id: uid}).assign({text: tas.text}).write()
            reply(`Установлен режим ${mode == 2 ? "спама постами" : "смешанного спама"} с таким текстом: \n${tas.text}`)
          })
          reply("📝Введите текст для спама постами", uid, {
            reply_markup: {
              keyboard: u.text ? [[u.text], ["Отмена"]] : [["Отмена"]],
              resize_keyboard: true
            }
          })
        }



        session(asd => {
          let as = asd.text.toLowerCase()
          if(command(["спам заявками", "requests"], 1, as))
            set(1)

          if(command(["спам постами в группы", "posts"], 1, as)){
            text(2)
          }

          if(command(["смешанный", "mix"], 1, as))
            text(3)
        })
        reply("🔢Выберите режим работы", uid, {
          reply_markup: {
            keyboard: [["Спам заявками"], ["Спам постами в группы"], ["Смешанный"], ["Отмена"]],
            resize_keyboard: true
          }
        })
      }

      if (command(['online', 'онлайн', '⏳онлайн'], 1, t)) {
        function set(token) {
          console.log(token)
          if (!token || (token != "on" && token != "off"))
            return reply("Ответ должен быть либо on либо off")
          users.find({
            id: uid
          }).assign({online: token == "on" ? true : false}).write();
          reply(`Автоонлайн установлен в состояние "${token}"`)
        }

        let us = users.find({id: uid}).value()

        session(asd => {
          set(asd.text.toLowerCase())
        })
        return reply(`Укажите состояние вечного онлайна (сейчас - ${us.online ? "on" : "off"})`, uid, {
          reply_markup: {
            keyboard: [["on"], ["off"],["Отмена"]],
            resize_keyboard: true
          }
        })
      }


      if (command(['sex', 'пол', '🚻пол'], 1, t)) {
        function set(token) {
          console.log(token)
          if (!token || (token != "любой" && token != "мужской" && token != "женский"))
            return reply("Пол должен быть либо мужской либо женский (или любой)")
          users.find({
            id: uid
          }).assign({sex: token == "мужской" ? 2 : token == "женский" ? 1 : false}).write();
          reply(`Установлена рассылка по полу "${token}"`)
        }

        let us = users.find({id: uid}).value()
        if(us.mode != 1 && us.mode != 3)
          return reply("У вас отключен режим спама заявками❌")

        session(asd => {
          set(asd.text.toLowerCase())
        })
        return reply(`Выберите пол (сейчас - ${us.sex == 1 ? "женский" : us.sex == 2 ? "мужской" : "любой"})`, uid, {
          reply_markup: {
            keyboard: [["Мужской"], ["Женский"], ["Любой"], ["Отмена"]],
            resize_keyboard: true
          }
        })
      }


      if(command(["reqdel", "удаление заявок", "⛔️удаление заявок"], 1, t)) {
        reply("Вы уверены, что хотите удалить все заявки❓ Заявки будут удалены со ваших аккаунтов", uid, {
          reply_markup: {
            keyboard: [["Да, удалить"], ["Отмена"]],
            resize_keyboard: true
          }
        })
        session(async sd => {
          if(command(["yes", "да, удалить", "да"], 1, sd.text.toLowerCase())) {
            reply("Удаление...")
            for (let token of users.find({id: uid}).value().tokens) {
              let res = (await getRequests(token)).items

              for (let i of res) {
                await request(token, "friends.delete", {user_id: i})
              }
            }
            reply("Все заявки удалены⛔️")
          }
        })
      }


      if (command(['limit', 'лимит', '♾лимит'], 1, t)) {
        function set(token) {
          console.log(token)
          if (!token || token == NaN || token < 1 || token > 3)
            return reply("Лимит заявок должен быть целым числом от 1 до 3")
          users.find({
            id: uid
          }).assign({limit: token}).write();
          reply(`Установлен лимит в ${token} заявок`)
        }

        let us = users.find({id: uid}).value()
        if(us.mode != 1 && us.mode != 3 && us.mode != undefined)
          return reply("У вас отключен режим спама заявками⛔️")

        session(asd => {
          set(~~asd.text)
        })
        return reply('📝Напишите лимит заявок', uid, {
          reply_markup: {
            keyboard: [["1"], ["2"], ["3"], ["Отмена"]],
            resize_keyboard: true
          }
        })
      }

      if(command(['auto', 'автопринятие', '✅автопринятие'], 2, t)) {
        function set(token) {
          if (!token || (token != "off" && token != "on"))
            return reply("Автопринятие заявок может принимать значение on либо off")
          users.find({
            id: uid
          }).assign({auto: token == "on" ? true : false}).write();
          reply(`Автопринятие ${token == "on" ? "включено" : "выключено"}`)
        }
        session(ms => {
          set(ms.text.toLowerCase())
        })
        return reply('Выберите действие', uid, {
          reply_markup: {
            keyboard: [["off"], ["on"], ["Отмена"]],
            resize_keyboard: true
          }
        });
      }
    })
  }



  if (!adm)
    return;

  if(command('+user', 2)) {
    let id = ~~m.split(' ')[1];
    async function add(id) {
      if (users.find({
        id: id
      }).value())
        return reply("Этот пользователь уже есть в базе данных");

      try {
        await reply(`Админ бота выдал вам доступ.Поздравляю!\nПропишите /help чтобы увидеть все доступные команды.\nСпасибо за покупку!`, id);
      }
      catch(e) {
        return reply("Этот пользователь не писал этому боту\nПопросите пользователя написать боту и добавьте его еще раз")
      }

      users.push({
        id: id,
        tokens: [],
        captcha: false
      }).write();

      reply(`${id} добавлен в базу данных`);
      if(uid != glav)
        reply(`${uid} добавил ${id} в базу данных`, glav);
    }

    if(id)
      add(id)
    else {
      session(m=> {
        if(m.forward_from)
          add(m.forward_from.id)
        else
          reply("Вы не переслали сообщение")
      })
      reply("Перешлите сообщение покупателя")
    }

  }

  if(command('-user', 2)) {
      if(uid != glav) return reply("Это может сделать только главный администратор. Пожалуйста, напишите ему, если вас обманули")

      let id = ~~m.split(' ')[1];
      if (!users.find({
        id: id
      }).value())
        return reply("Этого пользователя нет в базе данных");

      users.remove({
      	id: id
      }).write();
      let comm = text.split(id.toString()+" ")[1]
      reply(`У вас был отнят доступ к накрутке ${comm ? `со словами "${comm}"` : `без комментариев`}`, id);
      reply(`${id} удалён из базы данных ${comm ? `со словами "${comm}"` : `без комментариев`}`);
    }

  if(uid != glav)
    return



  if(command('рассылка')) {
    session(m => {
      reply("Рассылка началась")
      for(let i of users.value()) {
        reply(m.text, i.id)
      }
    })
    reply('📝Введите текст для рассылки')
  }

  if(command(["eval", "execute"])) {
    session(async m => {
      try {
        reply(`Output: ${eval(m.text)}`)
      }
      catch(e) {
        reply(`Выполнение кода завершилось с ошибкой \n${e}`)
      }
    })
    reply("📝Введите код")
  }

});

async function check(token, id, del=true, retry=0){
  let res = await getUsers(token);
  if(!res.error || res.error.error_code != 5)
    return true;
  else {
    if(del && retry==0){
      t.sendMessage(id, `Токен ${token} был удалён т.к. перестал работать`);

      let tokens = users.find({id: id}).value().tokens.filter((val)=> {
        return val != token;
      })

      users.find({id: id}).assign({
        tokens: tokens
      }).write();
    }
    else if(retry > 0)
      return check(token, id, del, retry-1)

    else
      return false;
  }
}

function rand(a, b) {
  return Math.round(Math.random() * (a-b)+b)
}

function random(array) {
  return array[rand(0, array.length-1)]
}

async function addFriend(token, user, id) {
  let aaa = stoplist.find({token: token}).value()
  if(aaa){
    if (aaa.exp > new Date().getTime())
      return
    else
      stoplist.remove({token: token}).write()
  }
  try {
    if(useProxy) {
      let proxy = random(proxyList)
      console.log(proxy)
      let httpsAgent = new require("https-proxy-agent")(proxy)
      var ax = axios.create({httpsAgent})
    }
    else
      var ax = axios
    let url = `http://api.vk.com/method/friends.add?user_id=${id}&v=5.95&access_token=${token}`
    let res = (await ax.get(url).catch(()=>{throw new Error()})).data

    if(res.error)
      console.log(res.error.error_code)
    else
      console.log(res)
    let u = await request(token, "users.get", {})
    if(res.error) {
      if(res.error.error_code == 2) {
        //stoplist.push({token: token, exp: (new Date().getTime())+300000}).write()
        if(u)
          t.sendMessage(user.id, `${u[0].first_name} ${u[0].last_name} - Vk Api Error 2 (Приложение выключено)\nПолучите токен через другое приложение либо читайте как включить ваше приложение (если вы получали токен со своего приложения)`)
      }

      if(res.error.error_code == 100)
        console.log(res.error.error_msg)

      if(res.error.error_code == 20) {
        if(u)
          t.sendMessage(user.id, `${u[0].first_name} ${u[0].last_name} - токен получен не в standalone приложении, смените токен, выбрав другое приложение\nНакрутка на таком токене невозможна`)
      }

      if(res.error.error_code == 17) {
        if(u)
          t.sendMessage(user.id, `${u[0].first_name} ${u[0].last_name} - Нужна валидация токена! Если вы видите это несколько раз подряд (4-5) - получите другой токен, иначе всё плачевно кончится\nКстати, проверьте привязку номера телефона к аккаунту ВКонтакте, если её нет то зачем вы добавили этот аккаунт)`)
      }

      if(res.error.error_code == 14) {
        if(!user.captcha) {
          //stoplist.push({token: token, exp: (new Date().getTime())+1800000}).write()
          //if(u && user.id == 712558825)
            //t.sendMessage(user.id, `${u[0].first_name} ${u[0].last_name} - капча!`)
        }

        else {
          let ruc = require('rucaptcha-client').create(user.captcha)
          try {
            let img = new Buffer((await axios.get(res.error.captcha_img, {responseType: 'arraybuffer'})).data,'binary').toString('base64')
            let sended = (await axios.post("https://rucaptcha.com/in.php", {key: user.captcha, method: "base64", json: 1, body: img})).data
            console.log(sended)
            if(sended.request == "ERROR_ZERO_BALANCE") {
              //stoplist.push({token: token, exp: new Date().getTime()+1800000}).write()
                t.sendMessage(user.id, `Не хватает баланса на RuCaptcha (баланс - ${await ruc.balance}руб.)`)
              return
            }

            else if (sended.request == ("ERROR_KEY_DOES_NOT_EXIST")) {
              users.find({id: user.id}).assign({captcha: false}).write()
              return t.sendMessage(user.id, `Ваш токен от RuCaptcha не работает/заблокирован и был удалён`)
            }

            else if (sended.request.startsWith("ERROR")) {
              return
            }
            setTimeout (async () => {
              var inp = (await axios.get(`https://rucaptcha.com/res.php?json=1&id=${sended.request}&action=get&key=${user.captcha}`).catch()).data
              if(inp.request != "CAPCHA_NOT_READY" && inp.request != "CAPTCHA_NOT_READY") {
                console.log(inp.request)
                if(!inp.request.startsWith("ERROR")){
                  let a = (await ax.get(url+`&captcha_sid=${res.error.captcha_sid}&captcha_key=${inp.request}`).catch()).data
                  if(a.error)
                    if(a.error.error_code == 14)
                    {console.log(`zhopa ${inp}`)}//ruc.report(sended.request).catch()

                  if(u) t.sendMessage(user.id, `${u[0].first_name} ${u[0].last_name} - капча успешно разгадана!\nОстаток на RuCaptcha - ${await ruc.balance} рублей`)
                }
              }

            },40000)
          }

          catch (e) {}
        }
      }
    }
  }
  catch(e) {
    return addFriend(token, user, id)
  }


}

async function request(token, method, params) {
  try{
    let res = (await axios( {
      method: 'post',
      url: `https://api.vk.com/method/${method}`,
      data: Object.assign({
        access_token:token,
        v: "5.95"
      }, params),
      transformRequest: [
        function(data, headers) {
          const serializedData = []

          for (const k in data) {
            if (data[k]) {
              serializedData.push(`${k}=${encodeURIComponent(data[k])}`)
            }
          }

          return serializedData.join('&')
        }
      ]
    })
    ).data
    if (res.response)
      return res.response
    else
      return res
  }
  catch(e) {
    return request(token, method, params)
  }
}

async function getGroup(token, gid) {
  return await request(token, "groups.getById", {group_id: gid, fields: `members_count`})
}

async function getUsers(token, id, fields) {
  return await request(token, "users.get", {user_ids: id, fields: fields})
}

async function getMembers(token, gid, offset) {
  return await request(token, "groups.getMembers",{group_id: gid, count: 1000, offset: offset})
}

async function getRequests(token, out=1,count=1000) {
  return await request(token, "friends.getRequests", {count: count, out: out, need_viewed: 0})
}
