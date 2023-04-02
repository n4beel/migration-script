import { constants } from "../constants";
const { Api, JsonRpc, JsSignatureProvider, RpcError } = require("alaiojs");
const fetch = require("node-fetch");

require("dotenv").config();

const rpcUrl = process.env.MAIN_NET;
// const rpcUrl = process.env.TEST_NET;

// Create a new JsonRpc instance
const rpc = new JsonRpc(rpcUrl, { fetch });

// Export readTable function
module.exports.readTable = async function (
  contractName: string,
  tableName: string,
  scope = constants.CONTRACT,
  limit = 10,
  lowerBound = ""
) {
  console.log(contractName);
  console.log(tableName);
  console.log(scope);

  const result = await rpc.get_table_rows({
    json: true,
    code: contractName,
    scope: scope,
    table: tableName,
    limit,
    lower_bound: lowerBound,
    reverse: false,
    show_payer: false,
  });
  return result.rows;
};

// Export readTable function
module.exports.numRows = async function (
  contractName: string,
  tableName: string,
  scope = constants.CONTRACT
): Promise<any[]> {
  const limit = 1000; // Set the number of rows to fetch per request
  let lowerBound = "";
  let more = true;
  let rows: any[] = [];

  while (more) {
    const result = await rpc.get_table_rows({
      json: true,
      code: contractName,
      scope: scope,
      table: tableName,
      lower_bound: lowerBound,
      limit: limit,
    });

    rows = rows.concat(result.rows);

    // Save the current rows to the JSON file
    // await fs.writeFile(outputFile, JSON.stringify(rows));

    console.log(rows.length);

    if (result.more) {
      lowerBound = result.rows[result.rows.length - 1].user;
    } else {
      more = false;
    }
  }

  return rows;
};

// Export callAction function
module.exports.callAction = async function (
  contractName: string,
  actionName: string,
  data: string,
  privateKey: string
) {
  const signatureProvider = new JsSignatureProvider([privateKey]);
  const api = new Api({
    rpc,
    signatureProvider,
  });

  const result = await api.transact(
    {
      actions: [
        {
          account: contractName,
          name: actionName,
          authorization: [
            {
              actor: "myaccount",
              permission: "active",
            },
          ],
          data: data,
        },
      ],
    },
    {
      blocksBehind: 3,
      expireSeconds: 30,
    }
  );

  return result.transaction_id;
};
