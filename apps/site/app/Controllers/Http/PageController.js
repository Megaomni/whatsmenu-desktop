"use strict";
const Env = use("Env");
const Drive = use("Drive");
const Helpers = use("Helpers");
const User = use("App/Models/User");
const FlexPlan = use("App/Models/FlexPlan");
const Profile = use("App/Models/Profile");
const ProfileV3 = use("App/Models/v3/Profile");
const Tag = use("App/Models/v3/Tag");
const Domain = use("App/Models/Domain");
const DomainV3 = use("App/Models/v3/Domain");
const Table = use("App/Models/Table");
const Tablev3 = use("App/Models/v3/Table");
const Category = use("App/Models/Category");
const Product = use("App/Models/Product");
const Cart = use("App/Models/v3/Cart");
const Encryption = use("Encryption");
const { createHash } = require("crypto");
const axios = require("axios");
const fs = use("fs");
const moment = require("moment");
const version = "49.3.9";
const valueBase = "79,90";
const GoogleProvider = use("GoogleProvider");
const View = use("View");
const Database = use("Database");
const fbToken = 'EAAHXSPURZBk4BO7KiPlKyoHESZCI6vliejJoeyEtWwgHYZCYEteEf7bW35MgZBZAi8ZBJ5ZBTobVnDu5zmmUVQ1yr9JcKhd80RicTG2syb5u3jj6l0OZBFtyvixeWDBNKkNskK6mlTDTwMeemZByMWUqpVXQnyuc4ZBz1RZCNHQj7ZAPEZAtlIKl2YAjefbsUYOOqZA5ciZBwZDZD';
const fbPixel = '513676703721378';
class PageController {
  async index(cx) {
    cx.count = await Profile.query()
      .where("created_at", ">", "2021-06-01")
      .getCount();
    if (cx.request.hostname() !== "172.31.29.21")
      switch (cx.request.hostname().replace("www.", "")) {
        case "qrcodenamesa.com.br":
          await this.mesa(cx);
          break;

        case "imprimaseuspedidos.com.br":
          await this.impressoras(cx);
          break;

        case "whatsmenu.com.br/mesa":
          this.table(cx);
          break;
        case "whatsmenu.com.br":
          this.whatsmenu(cx);
          break;

        case "www.whatsmenu.com.br":
          this.whatsmenu(cx);
          break;

        case "carddelivery.com.br":
          this.carddelivery(cx);
          break;

        case "www.carddelivery.com.br":
          this.carddelivery(cx);
          break;

        case "jason.com":
          this.whatsmenu(cx);
          break;

        default:
          let domain = await Domain.findBy(
            "name",
            cx.request.hostname().replace("www.", "")
          );
          if (!domain) {
            domain = await DomainV3.findBy(
              "name",
              cx.request.hostname().replace("www.", "")
            );
          }
          // console.log({dominio_aqui: domain});

          if (domain) {
            let profile = await domain.profile().fetch();
            if (profile && profile.options.migrated_at) {
              profile = await ProfileV3.find(domain.profileId);
            }
            cx.profile = profile;
            cx.params.profile = profile.toJSON();
            cx.params.slug = profile.slug;

            await this.client(cx);
          } else {
            this.whatsmenu(cx);
          }
      }
  }

  async whatsmenu({ request, response, view, count, locale }) {
    console.log("whatsmenu");
    console.log(locale);
    const userAgent = request.header("X-User-Agent").toLowerCase();
    let ambient = "desktop";
    if (userAgent.includes("iphone") || userAgent.includes("android")) {
      ambient = "mobile";
    }

    response.send(
      view.render("novaindex", {
        title: "WhatsMenu",
        name: "WhatsMenu",
        description: "",
        logo: "logo.png",
        styleName: "style.css",
        whatsmenu: "5511919196875",
        count: count,
        showNetwork: true,
        showVideo: true,
        valueBase: valueBase,
        ambient: ambient,
        page: "WhatsMenu",
        showValue: locale !== "pt-BR" ? false : true,
        isIphone: userAgent.includes("iphone"),
      })
    );
  }

  async pixStatus({ request, response }) {
    const { id } = request.all();

    try {
      const login = await axios.post(
        "https://api-prd.grovepay.com.br/auth/login",
        { email: "kaique@redblock.com.br", password: "Senha@@2023" }
      );
      const headers = {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${login.data.access_token}`,
      };
      const req = await axios.post(
        "https://api-prd.grovepay.com.br/pagarme/transaction/pix/status",
        { order_id: id },
        { headers: headers }
      );

      response.json(req.data);
    } catch (error) {
      console.error(error);
    }
  }

  async land2({ response, view }) {
    const count = await Profile.query()
      .where("created_at", ">", "2021-06-01")
      .getCount();
    response.send(
      view.render("land2", {
        title: "WhatsMenu - Live",
        name: "WhatsMenu",
        description: "Seu pedido da mesa direto para impressora",
        logo: "logo.png",
        styleName: "style.css",
        count: count,
        // whatsmenu: '5513996260670',
        whatsmenu: "5511919196875",
        // whatsmenu: '5511937036875',
        showNetwork: true,
        showVideo: true,
        valueBase: valueBase,
      })
    );
  }

  async landif1({ response, view }) {
    const count = await Profile.query()
      .where("created_at", ">", "2021-06-01")
      .getCount();
    response.send(
      view.render("landif1", {
        title: "WhatsMenu",
        name: "WhatsMenu",
        description: "Seu pedido da mesa direto para impressora",
        logo: "logo.png",
        styleName: "style.css",
        count: count,
        // whatsmenu: '5513996260670',
        whatsmenu: "5511919196875",
        // whatsmenu: '5511937036875',
        showNetwork: true,
        showVideo: true,
        valueBase: valueBase,
      })
    );
  }

  async landif2({ response, view }) {
    const count = await Profile.query()
      .where("created_at", ">", "2021-06-01")
      .getCount();
    response.send(
      view.render("landif2", {
        title: "WhatsMenu",
        name: "WhatsMenu",
        description: "Seu pedido da mesa direto para impressora",
        logo: "logo.png",
        styleName: "style.css",
        count: count,
        // whatsmenu: '5513996260670',
        whatsmenu: "5511919196875",
        // whatsmenu: '5511937036875',
        showNetwork: true,
        showVideo: true,
        valueBase: valueBase,
      })
    );
  }

  async live({ response, view }) {
    // const count = await Profile.query().where('created_at', '>', '2021-06-01').getCount()
    response.send(
      view.render("live", {
        title: "WhatsMenu - Live",
        name: "WhatsMenu - Live",
        description: "Conheça o WhatsMenu assistindo nossa live.",
        logo: "logo.png",
        styleName: "style.css",
        // count: count,
        // whatsmenu: '5513996260670',
        whatsmenu: "5511919196875",
        // whatsmenu: '5511937036875',
        showNetwork: true,
        showVideo: true,
        valueBase: valueBase,
      })
    );
  }

  async live2({ response, view }) {
    // const count = await Profile.query().where('created_at', '>', '2021-06-01').getCount()
    response.send(
      view.render("live2", {
        title: "WhatsMenu - Live",
        name: "WhatsMenu - Live",
        description: "Coneça o WhatsMenu assistindo nossa live.",
        logo: "logo.png",
        styleName: "style.css",
        // count: count,
        // whatsmenu: '5513996260670',
        whatsmenu: "5511919196875",
        // whatsmenu: '5511937036875',
        showNetwork: true,
        showVideo: true,
        valueBase: valueBase,
      })
    );
  }

  async carddelivery({ response, view }) {
    response.send(
      view.render("fullindex", {
        title: "CardDelivery",
        name: "Card Digital",
        description: "",
        logo: "logocard.png",
        styleName: "style-blue.css",
        whatsmenu: "5513981277413",
        showNetwork: false,
        showVideo: false,
        valueBase: valueBase,
      })
    );
  }

  async clienteDomain(cx) {
    const { request, response, view } = cx;
    try {
      const profile = await Profile.findBy("domain", request.hostname());

      if (profile && profile.status) {
        response.plainCookie("slug", profile.slug);
        return response.send(
          view.render("profile", {
            profile: profile,
          })
        );
      } else if (profile && !profile.status) {
        return response.send("<h1>Loja Bloqueada!</h1>");
      } else {
        this.whatsmenu(cx);
      }
    } catch (error) {
      console.error({
        date: new Date(),
        domain: request.hostname(),
        error: error,
      });
      response.send("<h1>Erro ao carregar página código: A48</h1>");
    }
  }

  async novaindex({ response, view, request }) {
    const userAgent = request.header("X-User-Agent").toLowerCase();
    let ambient = "desktop";
    if (userAgent.includes("iphone") || userAgent.includes("android")) {
      ambient = "mobile";
    }
    const count = await Profile.query()
      .where("created_at", ">", "2021-06-01")
      .getCount();
    response.send(
      view.render("novaindex", {
        title: "WhatsMenu",
        name: "WhatsMenu",
        description: "Seu pedido da mesa direto para impressora",
        logo: "logo.png",
        styleName: "novastyle.css",
        count: count,
        // whatsmenu: '5513996260670',
        whatsmenu: "5511919196875",
        // whatsmenu: '5511937036875',
        showNetwork: true,
        showVideo: true,
        valueBase: valueBase,
        ambient: ambient,
      })
    );
  }

  async mesaframe({ response, view }) {
    const count = await Profile.query()
      .where("created_at", ">", "2021-06-01")
      .getCount();
    response.send(
      view.render("mesa-frame", {
        title: "WhatsMenu - Mesa",
        name: "WhatsMenu",
        description: "Seu pedido da mesa direto para impressora",
        logo: "logo.png",
        styleName: "style2.css",
        count: count,
        // whatsmenu: '5513996260670',
        whatsmenu: "5511919196875",
        // whatsmenu: '5511937036875',
        showNetwork: true,
        showVideo: true,
        valueBase: valueBase,
      })
    );
  }

  async numberRouter({ request, response, view }) {
    try {
      const { data } = await axios.get(
        `${Env.get("API_LOCAL", "http://localhost:3338")}/api/v2/number-site`
      );
      const number = data.number;
      const contact = request.except(["_csrf", "userAgent", "page"]);
      const { userAgent, page, spreadsheetId, sheetHidden, fbp } =
        request.all();

      if (
        contact.why ||
        !contact.name ||
        !contact.whatsapp ||
        (contact.whatsapp && contact.whatsapp.length < 14)
      ) {
        return response
          .status(403)
          .json({ erro: 403, message: "operação não permitida" });
      } else {
        delete contact.why;
      }

      try {
        await axios.post(`https://graph.facebook.com/v16.0/${fbPixel}/events?access_token=${fbToken}`, {
          data: [
            {
              event_name: "Lead",
              event_time: moment().utc().unix(),
              action_source: "website",
              user_data: {
                em: [null],
                ph: [
                  createHash("sha256").update(contact.whatsapp).digest("hex"),
                ],
                fn: createHash("sha256").update(contact.name).digest("hex"),
                client_user_agent: userAgent,
                client_ip_address: request.header("x-real-ip"),
                fbp: fbp,
              },
            },
          ],
        }
        );
      } catch (error) {
        console.error(error.response);
      }

      contact.contacted_at = null;
      contact.date = moment().format();

      const path = "site/registers";
      let file = await Drive.disk("s3").exists(
        `${path}/${moment().format("YYYY-MM")}.json`
      );
      if (!file) {
        await Drive.disk("s3").put(
          `${path}/${moment().format("YYYY-MM")}.json`,
          Buffer.from(JSON.stringify([contact]))
        );
      } else {
        file = await Drive.disk("s3").get(
          `${path}/${moment().format("YYYY-MM")}.json`
        );
        file = JSON.parse(file);
        file.push(contact);
        await Drive.disk("s3").put(
          `${path}/${moment().format("YYYY-MM")}.json`,
          Buffer.from(JSON.stringify(file))
        );
      }
      /*
        if (sheetHidden === "whatsmenu") {
          GoogleProvider.sheets.addRowsPlan(
            [
              [
                contact.name,
                contact.whatsapp,
                contact.work,
                moment(contact.date).format("DD/MM/YYYY HH:mm:SS"),
                contact.utm_source ? contact.utm_source : "-",
                contact.utm_medium ? contact.utm_medium : "-",
                contact.utm_campaign ? contact.utm_campaign : "-",
                contact.utm_content ? contact.utm_content : "-",
                contact.utm_term ? contact.utm_term : "-",
              ],
            ],
            spreadsheetId
          );
        }
        if (sheetHidden === "whatsmenu-hotel") {
          GoogleProvider.sheets.addRowsPlan(
            [
              [
                contact.name,
                contact.whatsapp,
                contact.type,
                moment(contact.date).format("DD/MM/YYYY HH:mm:SS"),
                contact.utm_source ? contact.utm_source : "-",
                contact.utm_medium ? contact.utm_medium : "-",
                contact.utm_campaign ? contact.utm_campaign : "-",
                contact.utm_content ? contact.utm_content : "-",
                contact.utm_term ? contact.utm_term : "-",
              ],
            ],
            spreadsheetId
          );
        }
      */
      let message = `*Nome:* ${contact.name ? contact.name : "Não Informado"
        }\n`;
      // message += `*WhatsApp:* ${whatsapp ? whatsapp : 'Não Informado'}\n`
      message += `*Eu trabalho com:* ${contact.work ? contact.work : "Não Informado"
        }\n\n`;
      console.log(page);
      switch (page) {
        case "basic":
          message +=
            "*Estou perdendo muito lucro para os APP de Delivery. Quero saber mais sobre a sua solução.*";
          break;
        case "mesa":
          message += "*Gostaria de saber mais sobre o CONTROLE DE MESAS*";
          break;

        case "encomenda":
          message += "*Gostaria de saber mais sobre a ENTREGA AGENDADA*";
          break;

        case "impressora":
          message += "*Gostaria de saber mais sobre WhatsMenu + Impressora*";
          break;
      }

      let link = `whatsapp://send?phone=${number}&text=${encodeURIComponent(
        message
      )}`;

      if (userAgent.includes("iPhone") || userAgent.includes("Windows")) {
        link = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
      }

      // response.redirect(link)

      response.send(
        view.render("obrigado", {
          link: link,
        })
      );
    } catch (error) {
      console.error(error);
    }
  }

  async client({ request, params, profile, response, view }) {
    try {
      // console.log(params.slug)
      profile = profile ? profile : await Profile.findBy("slug", params.slug);
      if (!profile || profile.options.migrated_at) {
        profile = await ProfileV3.findBy("slug", params.slug);
      }
      if (profile && profile.slug == "restaturantbrazil") {
        console.error({ version: profile.options.version });
      }
      const category = params.categoryId
        ? await profile.categories().where("id", params.categoryId).first()
        : undefined;
      const product =
        params.productId && category
          ? await category.products().where("id", params.productId).first()
          : undefined;

      if (category || product) {
        console.log({
          category: category,
          product: product,
        });
      }

      // console.log('chola', profile);

      //   const category = params.categoryId ? await Category.find(params.categoryId) : undefined;
      //   const product = params.productId ? await Product.find(params.productId) : undefined;

      const cart = params.cartCode
        ? await Cart.query()
          .where({ profileId: profile.id, code: params.cartCode })
          .first()
        : undefined;
      // console.log(cart)

      const type = (() => {
        if (category && product) {
          return "product";
        } else if (category) {
          return "category";
        } else if (cart) {
          return "order";
        } else {
          return "default";
        }
      })();

      // console.log(type)

      if (profile && profile.status) {
        if (profile.slug === "restaurantbrazil") {
          console.error(profile.options.version);
        }
        // const user = await User.findBy('id', profile.userId);
        // console.log('chegou aquii');
        const user = await profile.user().fetch();
        // console.log({ user: user.id });
        let plans = await user.plans().fetch();
        plans = plans.toJSON();

        const allPlansDisponibility = plans.map((plan) => plan.category);

        response.clearCookie("slug");
        response.clearCookie("package");
        response.clearCookie("basic");
        response.clearCookie("table");
        response.clearCookie("onlyBasic");
        response.clearCookie("onlyPackage");
        response.clearCookie("onlyTable");
        response.clearCookie("noPlans");

        if (allPlansDisponibility.length === 0) {
          response.plainCookie("noPlans", "true");
        } else if (allPlansDisponibility.length === 1) {
          allPlansDisponibility.forEach((plan) => {
            let planC = plan.charAt(0).toUpperCase() + plan.slice(1);
            response.plainCookie(`only${planC}`, "true");
          });
        } else {
          allPlansDisponibility.forEach((plan) => {
            if (plan !== "table") {
              response.plainCookie(plan, "true");
            }
          });
        }

        const { data } = request.all();
        const dataDecrypted = Encryption.decrypt(data);
        if (profile.slug == "restaurantbrazil") {
          // console.error(typeof profile.options , dataDecrypted, "aqui")
        }
        let table;
        if (profile) {
          table =
            dataDecrypted &&
            (await profile.tables().where("id", dataDecrypted.table).first());
        }
        // if (!table){
        //     profile = await ProfileV3.findBy('slug', params.slug)
        //     table = dataDecrypted && await profile.tables().where('id', dataDecrypted.table).first()
        // }
        let scripts = "";
        let files;
        if (profile.options.migrated_at || profile.id >= 1000000) {
          files = fs.readdirSync(Helpers.publicPath("profile2"));
          scripts += `<script src="/profile2/${files.find((f) =>
            f.includes("runtime")
          )}?v=${version}" type="module"></script>`;
          scripts += `<script src="/profile2/${files.find((f) =>
            f.includes("polyfills")
          )}?v=${version}" type="module"></script>`;
          scripts += `<script src="/profile2/${files.find((f) =>
            f.includes("scripts")
          )}?v=${version}" defer></script>`;
          scripts += `<script src="/profile2/${files.find((f) =>
            f.includes("main")
          )}?v=${version}" type="module"></script>`;
        } else {
          files = fs.readdirSync(Helpers.publicPath("profile"));
          scripts = `<script src="/profile/${files.find((f) =>
            f.includes("runtime-es2015")
          )}?v=${version}" type="module"></script>`;
          scripts += `<script src="/profile/${files.find((f) =>
            f.includes("runtime-es5")
          )}?v=${version}" nomodule defer></script>`;
          scripts += `<script src="/profile/${files.find((f) =>
            f.includes("polyfills-es5")
          )}?v=${version}" nomodule defer></script>`;
          scripts += `<script src="/profile/${files.find((f) =>
            f.includes("polyfills-es2015")
          )}?v=${version}" type="module"></script>`;
          scripts += `<script src="/profile/${files.find((f) =>
            f.includes("scripts")
          )}?v=${version}" defer></script>`;
          scripts += `<script src="/profile/${files.find((f) =>
            f.includes("main-es2015")
          )}?v=${version}" type="module"></script>`;
          scripts += `<script src="/profile/${files.find((f) =>
            f.includes("main-es5")
          )}?v=${version}" nomodule defer></script>`;
        }

        response.plainCookie("slug", profile.slug);

        if (dataDecrypted) {
          // return response.route('client.table', {id: table.id, slug: profile.slug})
          const tableEncrypted = await Encryption.encrypt(
            JSON.stringify(table.toJSON())
          );
          // console.log(tableEncrypted);
          response.plainCookie("table", tableEncrypted);
          response.plainCookie("admOrder", dataDecrypted.admOrder);
        } else {
          response.clearCookie("table");
        }

        return response.json(
          // {profile: profile}
          view.render("profile", {
            profile: profile,
            scripts: scripts,
            type: type,
            cart: cart ? cart.toJSON() : undefined,
            category: category ? category.toJSON() : undefined,
            product: product ? product.toJSON() : undefined,
            ogImage: request._qs.name,
            tableId:
              dataDecrypted && dataDecrypted.table
                ? dataDecrypted.table.id
                : "",
            styles: `<link rel="stylesheet" href="/${profile.options.migrated_at || profile.id >= 1000000
              ? "profile2"
              : "profile"
              }/${files.find((f) => f.includes("styles"))}?v=${version}">`,
          })
        );
      } else {
        // return response.send(request.url());
        console.log(request.url());
        try {
          let file = fs.readFileSync(
            Helpers.publicPath(`profile2${request.url()}`),
            "utf8"
          );

          if (!file) {
            file = fs.readFileSync(
              Helpers.publicPath(`profile2  ${request.url()}`),
              "utf8"
            );
          }

          if (file) {
            response.type("application/javascript");
            return response.send(file);
          }
        } catch (error) {
          response.status(200);
          return response.send("<h1>Arquivo não encontrado</h1>");
        }
        // console.log(file)

        response.send("<h1>Página não encontrada!</h1>");
      }
    } catch (error) {
      console.error({
        date: new Date(),
        // slug: params.profile ? params.profile : await Profile.findBy('slug', params.slug),
        error: error,
      });
      response.send("Erro");
    }
  }

  async table({ request, profile, table, params, response }) {
    try {
      // const profile = params.profile ? params.profile : await Profile.findBy('slug', params.slug)

      // const table = await Table.findBy('id', params.id)
      // console.log({ slug: profile.slug, profileId: profile.id, tableId: table.id });

      if (profile && profile.status) {
        const files = fs.readdirSync(Helpers.publicPath("profile"));
        let scripts = `<script src="/profile/${files.find((f) =>
          f.includes("runtime-es2015")
        )}?v=${version}" type="module"></script>`;
        scripts += `<script src="/profile/${files.find((f) =>
          f.includes("runtime-es5")
        )}?v=${version}" nomodule defer></script>`;
        scripts += `<script src="/profile/${files.find((f) =>
          f.includes("polyfills-es5")
        )}?v=${version}" nomodule defer></script>`;
        scripts += `<script src="/profile/${files.find((f) =>
          f.includes("polyfills-es2015")
        )}?v=${version}" type="module"></script>`;
        scripts += `<script src="/profile/${files.find((f) =>
          f.includes("scripts")
        )}?v=${version}" defer></script>`;
        scripts += `<script src="/profile/${files.find((f) =>
          f.includes("main-es2015")
        )}?v=${version}" type="module"></script>`;
        scripts += `<script src="/profile/${files.find((f) =>
          f.includes("main-es5")
        )}?v=${version}" nomodule defer></script>`;

        let hash = Encryption.encrypt({
          table: typeof table === "string" ? table : table.id,
          admOrder: request.qs.admOrder ? true : false,
        });

        response.redirect(`/${profile.slug}?data=${encodeURIComponent(hash)}`);
      } else {
        response.send("<h1>Página não encontrada!</h1>");
      }
    } catch (error) {
      console.error(error);
    }
  }

  async indexAulas({ response, view }) {
    try {
      let lessons = await Drive.get(Helpers.publicPath("lessons.json"));
      lessons = JSON.parse(lessons.toString());

      return response.send(
        view.render("videoaulas-new.index", { lessons: lessons })
      );
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async aula({ params, response, view }) {
    try {
      let page = parseInt(params.id);
      let type = params.type;
      let lessons = await Drive.get(Helpers.publicPath("lessons.json"));
      lessons = JSON.parse(lessons.toString());

      return response.send(
        view.render("videoaulas-new.aulas.aula", {
          lessons: lessons,
          item: lessons[type][--page],
          page: ++page,
          type: type,
        })
      );
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async clientsPage({ request, response, view }) {
    try {
      const count = await Profile.query()
        .where("created_at", ">", "2021-06-01")
        .getCount();
      const siteInfo = {
        title: "WhatsMenu",
        name: "WhatsMenu",
        description: "",
        logo: "logo.png",
        styleName: "style.css",
        whatsmenu: "5513996260670",
        count: count,
        showNetwork: true,
        showVideo: true,
      };

      response.send(view.render("clientes", siteInfo));
    } catch (error) {
      throw error;
    }
  }

  async reuniao({ params, response, view }) {
    try {
      const dateLimit = `${params.year}-${params.month}-${params.day}T${params.hour}:${params.minute}:00`;

      response.send(
        view.render("reuniao", {
          limit: dateLimit,
          styleName: "style.css",
          title: "Reúnião",
        })
      );
    } catch (error) { }
  }

  async getRegisters({ params, response }) {
    try {
      const file = await Drive.disk("s3").get(
        `site/registers/${params.year}-${params.month}.json`
      );
      response.json(JSON.parse(file));
    } catch (error) {
      response.send("<h1>Lista não encontrada</h1>");
    }
  }
  async getListRegisters({ params, response, view }) {
    try {
      const file = await Drive.disk("s3").get(
        `site/registers/${params.year}-${params.month}.json`
      );
      response.send(
        view.render("listregisters", { clients: JSON.parse(file) })
      );
    } catch (error) {
      response.send("<h1>Lista não encontrada</h1>");
    }
  }

  async impressoras({ response, view }) {
    const count = await Profile.query()
      .where("created_at", ">", "2021-06-01")
      .getCount();
    response.send(
      view.render("impressoras", {
        title: "WhatsMenu - Impressoras",
        name: "WhatsMenu",
        description: "Seu pedido do whatsapp direto para impressora",
        logo: "logo.png",
        styleName: "style.css",
        count: count,
        // whatsmenu: '5513996260670',
        whatsmenu: "5511919196875",
        // whatsmenu: '5511937036875',
        showNetwork: true,
        showVideo: true,
        valueBase: valueBase,
      })
    );
  }

  async mesa({ response, view }) {
    const count = await Profile.query()
      .where("created_at", ">", "2021-06-01")
      .getCount();
    response.send(
      view.render("mesa", {
        title: "WhatsMenu - Mesa",
        name: "WhatsMenu",
        description: "Seu pedido da mesa direto para impressora",
        logo: "logo.png",
        styleName: "style2.css",
        count: count,
        // whatsmenu: '5513996260670',
        whatsmenu: "5511919196875",
        // whatsmenu: '5511937036875',
        showNetwork: true,
        showVideo: true,
        valueBase: valueBase,
      })
    );
  }

  async mesaframe({ response, view }) {
    const count = await Profile.query()
      .where("created_at", ">", "2021-06-01")
      .getCount();
    response.send(
      view.render("mesa-frame", {
        title: "WhatsMenu - Mesa",
        name: "WhatsMenu",
        description: "Seu pedido da mesa direto para impressora",
        logo: "logo.png",
        styleName: "style2.css",
        count: count,
        // whatsmenu: '5513996260670',
        whatsmenu: "5511919196875",
        // whatsmenu: '5511937036875',
        showNetwork: true,
        showVideo: true,
        valueBase: valueBase,
      })
    );
  }

  async ebook({ response, view }) {
    const count = await Profile.query()
      .where("created_at", ">", "2021-06-01")
      .getCount();
    response.send(
      view.render("ebook", {
        title: "WhatsMenu - Ebook",
        name: "WhatsMenu",
        description: "Seu pedido da mesa direto para impressora",
        logo: "logo.png",
        styleName: "style2.css",
        count: count,
        // whatsmenu: '5513996260670',
        whatsmenu: "5511919196875",
        // whatsmenu: '5511937036875',
        showNetwork: true,
        showVideo: true,
        valueBase: valueBase,
      })
    );
  }

  async encomenda({ response, view }) {
    const count = await Profile.query()
      .where("created_at", ">", "2021-06-01")
      .getCount();
    response.send(
      view.render("encomenda", {
        title: "WhatsMenu - Encomenda",
        name: "WhatsMenu",
        description: "Seu pedido da mesa direto para impressora",
        logo: "logo.png",
        styleName: "style2.css",
        count: count,
        // whatsmenu: '5513996260670',
        whatsmenu: "5511919196875",
        // whatsmenu: '5511937036875',
        showNetwork: true,
        showVideo: true,
        valueBase: valueBase,
      })
    );
  }

  async encomendaframe({ response, view }) {
    const count = await Profile.query()
      .where("created_at", ">", "2021-06-01")
      .getCount();
    response.send(
      view.render("encomenda-frame", {
        title: "WhatsMenu - Encomenda",
        name: "WhatsMenu",
        description: "Seu pedido da mesa direto para impressora",
        logo: "logo.png",
        styleName: "style2.css",
        count: count,
        // whatsmenu: '5513996260670',
        whatsmenu: "5511919196875",
        // whatsmenu: '5511937036875',
        showNetwork: true,
        showVideo: true,
        valueBase: valueBase,
      })
    );
  }

  async hotel({ response, view }) {
    const count = await Profile.query()
      .where("created_at", ">", "2021-06-01")
      .getCount();
    response.send(
      view.render("hotel", {
        title: "WhatsMenu - Hotel",
        name: "WhatsMenu",
        description: "Seu pedido da mesa direto para impressora",
        logo: "logo.png",
        styleName: "style2.css",
        count: count,
        // whatsmenu: '5513996260670',
        whatsmenu: "5511919196875",
        // whatsmenu: '5511937036875',
        showNetwork: true,
        showVideo: true,
        valueBase: valueBase,
        falec: true,
      })
    );
  }

  async printLayout({ request, response }) {
    try {
      const { data } = await axios.post(
        "https://next.whatsmenu.com.br/api/printLayout",
        request.all()
      );
      response.json(data);
    } catch (error) {
      throw error;
    }
  }
  async printLayoutPDF({ request, response }) {
    try {
      const { data } = await axios.post(
        "https://next.whatsmenu.com.br/api/printLayoutPDF",
        request.all()
      );
      response.json(data);
    } catch (error) {
      return error;
    }
  }

  async webhook({ request, response }) {
    const data = {
      date: moment().format(),
      method: request.method(),
      body: request.all(),
    };

    try {
      const path = "site/webhook";
      if (data.method !== "GET") {
        let file = await Drive.disk("s3").exists(`${path}/ifood.json`);
        if (!file) {
          await Drive.disk("s3").put(
            `${path}/ifood.json`,
            Buffer.from(JSON.stringify([data]))
          );
        } else {
          file = await Drive.disk("s3").get(`${path}/ifood.json`);
          file = JSON.parse(file);
          file.unshift(data);
          await Drive.disk("s3").put(
            `${path}/ifood.json`,
            Buffer.from(JSON.stringify(file))
          );
        }
        response.json(data);
      } else {
        const limit = request.input("limit");
        const file = JSON.parse(
          await Drive.disk("s3").get(`${path}/ifood.json`)
        );
        response.json(limit ? file.filter((f, i) => i < limit) : file);
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async portalHome({ request, response, view }) {
    try {
      const ip = request.header("x-real-ip");
      response.send(view.render("portalhome", { ip: ip }));
    } catch (error) {
      console.error(error);
    }
  }

  async portal({ request, params, response, view }) {
    try {
      const { cities, allCities, allEstates, estate, redirect } =
        await this.getLocation(params);
      const userAgent = request.header("X-User-Agent").toLowerCase();
      let ambient = "desktop";
      if (userAgent.includes("iphone") || userAgent.includes("android")) {
        ambient = "mobile";
      }
      if (redirect) {
        return response.redirect(redirect);
      } else if (!cities.length) {
        return response.send("cidade não encontrada");
      }

      const cupons = await ProfileV3.query()
        .setVisible(["slug", "logo"])
        .where("status", 1)
        .whereRaw(
          `address->"$.city" in ${JSON.stringify(cities)
            .replace("[", "(")
            .replace("]", ")")}`
        )
        .whereHas("cupons", (cupom) => cupom.whereNull("deleted_at"), ">", 0)
        .with("cupons", (cupom) =>
          cupom.whereNull("deleted_at").orderByRaw("RAND()")
        )
        .orderByRaw("RAND()")
        // .limit(9)
        // .on('query', console.log)
        .paginate(1, 9);

      const profiles = await ProfileV3.query()
        .setVisible(["name", "address", "slug", "logo"])
        .where("status", 1)
        .whereRaw(
          `address->"$.city" in ${JSON.stringify(cities)
            .replace("[", "(")
            .replace("]", ")")}`
        )
        .with("cupons", (cupom) =>
          cupom.whereNull("deleted_at").orderByRaw("RAND()")
        )
        .orderByRaw("RAND()")
        // .limit(9)
        .paginate(1, 18);

      const highlights = await ProfileV3.query()
        .setVisible(["name", "address", "slug", "logo"])
        .where("status", 1)
        .whereRaw(
          `address->"$.city" in ${JSON.stringify(cities)
            .replace("[", "(")
            .replace("]", ")")}`
        )
        .whereNotIn(
          "id",
          profiles.rows.map((p) => p.id)
        )
        .orderByRaw("RAND()")
        // .limit(3)
        .paginate(1, 3);

      const tags = await Tag.query()
        .where("status", 1)
        .whereNull("deleted_at")
        .whereHas("profiles", (profile) =>
          profile.whereRaw(
            `address->"$.city" in ${JSON.stringify(cities)
              .replace("[", "(")
              .replace("]", ")")}`
          )
        )
        .orderBy("name")
        .fetch();

      View.global("upper", (txt) => txt.toUpperCase());
      View.global("CityToURL", (txt) => {
        if (txt) {
          return this.normalizeString(txt.toLowerCase()).split(" ").join("-");
        }
        return "#";
      });
      response.send(
        view.render("portal", {
          atualCity: cities.length ? cities[0] : city,
          cupons: cupons.toJSON(),
          profiles: profiles.toJSON(),
          highlights: highlights.toJSON(),
          estates: allEstates,
          atualEstate: estate,
          allCities: allCities,
          citiesShuffle: allCities
            .map((value) => ({ value, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({ value }) => value),
          cityPath: params.city,
          portal: "home",
          ambient: ambient,
          tags: tags.toJSON(),
        })
      );
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async listagem({ request, params, response, view }) {
    try {
      // console.log(request);
      // return response.send(request.originalUrl())
      const userAgent = request.header("X-User-Agent").toLowerCase();
      let ambient = "desktop";
      if (userAgent.includes("iphone") || userAgent.includes("android")) {
        ambient = "mobile";
      }
      const filters = {
        tags: Array.isArray(request.input("tags"))
          ? request.input("tags")
          : [request.input("tags") ? request.input("tags") : null],
        cupom: request.input("cupom") ? Number(request.input("cupom")) : 0,
      };
      const tags = await Tag.query()
        .whereIn("id", filters.tags ? filters.tags : [0])
        .fetch();
      const { cities, allCities, allEstates, estate, redirect } =
        await this.getLocation(params);
      if (redirect) {
        return response.redirect(redirect);
      } else if (!cities.length) {
        return response.send("cidade não encontrada");
      }

      let profiles = ProfileV3.query()
        .setVisible(["name", "address", "slug", "logo"])
        .where("status", 1)
        .whereRaw(
          `address->"$.city" in ${JSON.stringify(cities)
            .replace("[", "(")
            .replace("]", ")")}`
        )
        .with("cupons", (cupom) =>
          cupom.whereNull("deleted_at").orderByRaw("RAND()")
        )
        .orderBy("id");
      if (filters.tags.find((t) => !!t)) {
        profiles.whereHas("tags", (tag) =>
          tag.whereIn("tags.id", filters.tags)
        );
      }
      if (filters.cupom) {
        profiles.whereHas("cupons", (cupom) =>
          cupom.whereNull("deleted_at").orderByRaw("RAND()")
        );
      }
      profiles = await profiles.paginate(params.page ? params.page : 1, 10);

      const allTags = await Tag.query()
        .whereNotIn("id", filters.tags.find((t) => !!t) ? filters.tags : [0])
        .where("status", 1)
        .whereNull("deleted_at")
        .whereHas("profiles", (profile) =>
          profile.whereRaw(
            `address->"$.city" in ${JSON.stringify(cities)
              .replace("[", "(")
              .replace("]", ")")}`
          )
        )
        .orderBy("name")
        .fetch();

      View.global("upper", (txt) => txt.toUpperCase());
      View.global("encodeURI", (txt) => encodeURIComponent(txt));
      View.global("CityToURL", (txt) =>
        this.normalizeString(txt.toLowerCase()).split(" ").join("-")
      );
      View.global("Paginate", (profiles) => {
        let x = 1;
        let paginate = "";
        while (x <= profiles.lastPage) {
          paginate += `<li class="page-item${x == profiles.page ? " disabled" : ""
            }"><a class="page-link" href="/portal/${params.city
            }/listagem/${x}">${x}</a></li>`;
          ++x;
        }
        return paginate;
      });
      response.send(
        view.render("listagem", {
          hasFilter: Object.keys(request.all()).length ? true : false,
          originalUrl: request.originalUrl(),
          atualCity: cities.length ? cities[0] : city,
          profiles: profiles.toJSON(),
          estates: allEstates,
          atualEstate: estate,
          allCities: allCities,
          allTags: allTags.toJSON(),
          tags: tags.toJSON(),
          citiesShuffle: allCities
            .map((value) => ({ value, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({ value }) => value),
          cityPath: params.city,
          ambient: ambient,
          portal: "list",
        })
      );
    } catch (error) {
      throw error;
    }
  }

  async cupom({ request, params, response, view }) {
    try {
      const { cities, allCities, allEstates, estate, redirect } =
        await this.getLocation(params);
      if (redirect) {
        return response.redirect(redirect);
      } else if (!cities.length) {
        return response.send("cidade não encontrada");
      }

      const profiles = await ProfileV3.query()
        .setVisible(["name", "slug", "logo", "cupons"])
        .where("status", 1)
        .whereRaw(
          `address->"$.city" in ${JSON.stringify(cities)
            .replace("[", "(")
            .replace("]", ")")}`
        )
        .whereHas("cupons", (cupom) => cupom.whereNull("deleted_at"), ">", 0)
        .with("cupons", (cupom) =>
          cupom.whereNull("deleted_at").orderByRaw("RAND()")
        )
        .orderByRaw("RAND()")
        .limit(9)
        // .on('query', console.log)
        .paginate(params.page ? params.page : 1, 12000);

      View.global("upper", (txt) => txt.toUpperCase());
      View.global("CityToURL", (txt) =>
        this.normalizeString(txt.toLowerCase()).split(" ").join("-")
      );
      View.global("Paginate", (profiles) => {
        let x = 1;
        let paginate = "";
        while (x <= profiles.lastPage) {
          paginate += `<li class="page-item${x == profiles.page ? " disabled" : ""
            }"><a class="page-link" href="/portal/${params.city
            }/listagem/${x}">${x}</a></li>`;
          ++x;
        }
        return paginate;
      });
      response.send(
        view.render("cupom", {
          atualCity: cities.length ? cities[0] : city,
          profiles: profiles.toJSON(),
          // highlights: highlights.toJSON(),
          estates: allEstates,
          atualEstate: estate,
          allCities: allCities,
          citiesShuffle: allCities
            .map((value) => ({ value, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({ value }) => value),
          cityPath: params.city,
          portal: "list",
        })
      );
    } catch (error) {
      throw error;
    }
  }

  async getListCities({ params, response }) {
    try {
      const estate = params.estate.toLowerCase();
      let dbcities = await Database.connection("mysql_v3").raw(
        `select distinct REPLACE(address->"$.city", "\\\"", "") as city from profiles where LOWER(REPLACE(address->"$.state", "\\\"", "")) = "${estate}" order by city asc`
      );
      const allCities = dbcities[0].filter((c) => c.city).map((c) => c.city);
      return response.json(allCities);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  normalizeString(text) {
    if (text) {
      return text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
    }
    return text;
  }

  async getLocation(params) {
    try {
      const cityEstate = params.city.toLowerCase().split("-");
      const estate =
        cityEstate && cityEstate.length > 1 ? cityEstate.pop() : null;

      if (!estate || (estate && estate.length > 2)) {
        let dbcities = await Database.connection("mysql_v3").raw(
          `select distinct REPLACE(address->"$.city", "\\\"", "") as city from profiles where status = 1 order by city asc`
        );
        const allCities = dbcities[0].filter((c) => c.city).map((c) => c.city);
        const cities = allCities.filter(
          (c) =>
            this.normalizeString(c) ===
            params.city.toLowerCase().split("-").join(" ")
        );
        // if (!cities.length) {
        //   return response.send('cidade não encontrada')
        // }
        const profile = await ProfileV3.query()
          .setVisible(["id", "address"])
          .where("status", 1)
          .whereRaw(
            `REPLACE(address->"$.city", "\\\"", "") in ${JSON.stringify(cities)
              .replace("[", "(")
              .replace(
                "]",
                ")"
              )} and REPLACE(address->"$.state", "\\\"", "") is not null and  REPLACE(address->"$.state", "\\\"", "") not in ("null", "undefined", "")`
          )
          .first();
        if (profile) {
          console.log("entrou aqui");
          return {
            redirect: `/portal/${this.normalizeString(
              params.city.toLowerCase()
            )}-${profile.address.state.toLowerCase()}`,
          };
          // return response.redirect()
        }
      }
      const city = cityEstate.join(" ");
      let dbcities = await Database.connection("mysql_v3").raw(
        `select distinct REPLACE(address->"$.city", "\\\"", "") as city from profiles where LOWER(REPLACE(address->"$.state", "\\\"", "")) = "${estate}" and status = 1 order by city asc`
      );
      const allCities = dbcities[0].filter((c) => c.city).map((c) => c.city);

      dbcities = await Database.connection("mysql_v3").raw(
        'select distinct REPLACE(address->"$.state", "\\"", "") as estate from profiles where REPLACE(address->"$.state", "\\"", "") is not null and REPLACE(address->"$.state", "\\"", "") not in ("null", "undefined") and status = 1 order by estate asc'
      );
      const allEstates = dbcities[0].map((c) => c.estate);
      dbcities = null;
      // return response.json({dbcities, allEstates})

      const cities = allCities.filter((c) => this.normalizeString(c) === city);
      // if (!cities.length) {
      //   return response.send('cidade não encontrada')
      // }
      return { cities, allEstates, allCities, estate };
    } catch (error) {
      return "cidade não encontrada";
    }
  }
}

module.exports = PageController;
