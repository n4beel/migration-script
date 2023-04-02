const neo4jService: any = require("./neo4j/neo4j");
const alaioService: any = require("./alaio/alaio");
const fs = require("fs/promises");
const outputFile = "errors.json";

// Example read query
const readQuery = "MATCH (u:User) RETURN collect(properties(u)) AS users";
const readParams = { age: 30 };

const main = async () => {
  let errorCount: number = 0;
  const errors: any[] = [];
  const users = new Set();
  let max_payout = 0;
  let div_paid = 0;

  try {
    // neo4jService
    //   .read(readQuery, readParams)
    //   .then((records: any) => {
    //     console.log("no of users", records[0].users.length);
    //   })
    //   .catch((error: any) => {
    //     console.log(error);
    //   });

    // const rows = await alaioService.readTable("kompwnd", "buddy");
    const buddies = await alaioService.numRows("kompwnd", "buddy");
    // const deposits = await alaioService.numRows("kompwnd", "deposits");

    for (let row of buddies) {
      users.add(row.user);
      users.add(row.buddy);
    }

    // for (let row of deposits) {
    //   max_payout += parseFloat(row.maxdiv);
    //   div_paid += parseFloat(row.divspayed);
    // }

    console.log("no of users =>", users.size);
    console.log("total max_payout =>", max_payout);
    console.log("total div_paid =>", div_paid);

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
