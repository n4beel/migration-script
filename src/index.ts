const neo4jService: any = require("./neo4j/neo4j");
const alaioService: any = require("./alaio/alaio");
const fs = require("fs/promises");
const fetch = require('node-fetch');
const outputFile = "errors.json";

const main = async () => {
  let errorCount: number = 0;
  const errors: any[] = [];

  try {
    let users: any[] = [];

    // Get KPW to USD price
    const response = await fetch(process.env.PRICE_SERVER + '/token/kpw-price');
    const data = await response.json();

    const kpw = data.kpwPrice

    console.log("KPW PRICE ==>", kpw)

    // Get all users
    await neo4jService
      .read("MATCH (u:User) RETURN collect(u{.*}) AS users", {})
      .then((records: any) => {
        console.log("no of users", records[0].users.length);
        users = records[0].users
      })
      .catch((error: any) => {
        console.log(error);
      });

    for (let user of users) {
      console.log("user => ", user.account_name)

      const updatedProps: any = {}

      let deposits: any[] = []
      let withdrawals: any[] = []

      // Get all deposits
      await neo4jService
        .read(`
          OPTIONAL MATCH (:User {id: $id})-[:DEPOSITED]->(d:Deposit)
          RETURN collect(d{.*}) as deposits
        `, {
          id: user.id
        })
        .then((records: any) => {
          deposits = records[0].deposits
        })
        .catch((error: any) => {
          console.log(error);
          errorCount++;
          errors.push({ ...user, errorAt: "GETTING ALL DEPOSITS" });
        });

      // Get all withdrawals
      await neo4jService
        .read(`
          OPTIONAL MATCH (:User {id: $id})-[:WITHDREW]->(w:Withdrawal)
          RETURN collect(w{.*}) as withdrawals
        `, {
          id: user.id
        })
        .then((records: any) => {
          withdrawals = records[0].withdrawals
        })
        .catch((error: any) => {
          console.log(error);
          errorCount++;
          errors.push({ ...user, errorAt: "GETTING ALL WITHDRAWALS" });
        });

      // console.log("=================== Total Deposit ===================")
      // console.log("user total deposit =>", user.max_payout / 2)
      // console.log("deposits amount KPW =>", deposits.reduce(
      //   (total, obj) => total + obj.amount_KPW + obj.rewards * 0.9,
      //   0,
      // ))

      // console.log("=================== Div paid ===================")
      // console.log("user div paid =>", user.div_paid)
      // console.log("withdrawals amount KPW =>", withdrawals.reduce(
      //   (total, obj) => total + obj.amount_KPW,
      //   0,
      // ))

      // if user does not have deposit and max_payout is greater than 0
      if (deposits.length <= 0 && user.max_payout > 0) {
        console.log("NO DEPOSITS FOUND")
        const max_payout = user.max_payout * kpw
        const div_paid = user.div_paid * kpw

        updatedProps.max_payout = max_payout
        updatedProps.div_paid = div_paid
        updatedProps.active_deposit = (max_payout - div_paid) / 2

      }
      else if (deposits.length > 0 && user.max_payout > 0) {
        console.log("DEPOSITS FOUND")

        const max_payout = deposits.reduce(
          (total, obj) => total + obj.amount_USD + obj.rewards_amount_USD * 0.9,
          0,
        )
        const div_paid = withdrawals.reduce(
          (total, obj) => total + obj.amount_USD,
          0,
        )

        updatedProps.max_payout = max_payout
        updatedProps.div_paid = div_paid
        updatedProps.active_deposit = (max_payout - div_paid) / 2
      }
      else {
        console.log("NO DEPOSITS OR OLD DATA FOUND")

        updatedProps.max_payout = 0
        updatedProps.div_paid = 0
        updatedProps.active_deposit = 0
      }

      updatedProps.max_payout_KPW = user.max_payout
      updatedProps.div_paid_KPW = user.div_paid
      updatedProps.active_deposit_KPW = user.active_deposit

      console.log("updated props =>", updatedProps)

      // Update user's props
      await neo4jService
        .write(`
          MATCH (u:User {id: $id})
          SET u += $updatedProps
          RETURN true as updated
        `, {
          id: user.id,
          updatedProps
        })
        .catch((error: any) => {
          console.log(error);
          errorCount++;
          errors.push({ ...user, errorAt: "UPDATING DATA" });
        });

    }

    // const rows = await alaioService.readTable("kompwnd", "buddy");
    // const buddies = await alaioService.numRows("kompwnd", "buddy");
    // const deposits = await alaioService.numRows("kompwnd", "deposits");

    // for (let row of buddies) {
    //   users.add(row.user);
    //   users.add(row.buddy);
    // }

    // for (let row of deposits) {
    //   max_payout += parseFloat(row.maxdiv);
    //   div_paid += parseFloat(row.divspayed);
    // }

    // console.log("no of users =>", users.size);
    // console.log("total max_payout =>", max_payout);
    // console.log("total div_paid =>", div_paid);

    // for (const [index, row] of rows.entries()) {
    //   let max_payout = parseFloat(row.maxdiv);
    //   let div_paid = parseFloat(row.divspayed);
    //   let active_deposit = (max_payout - div_paid) / 2;
    //   let last_action = row.last_action * 1000;

    //   console.log({
    //     index,
    //     user: row.user,
    //   });

    //   await neo4jService
    //     .updateUser(row.user, {
    //       max_payout,
    //       div_paid,
    //       active_deposit,
    //       last_action: last_action,
    //       last_deposited: last_action,
    //     })
    //     .catch((e: any) => {
    //       console.log(e);
    //       errorCount++;
    //       errors.push(row);
    //     });
    // }

    console.log("errorCount =>", errorCount);
    await fs.writeFile(outputFile, JSON.stringify(errors));
  } catch (error) {
    console.log(error);
  }
};

main();
