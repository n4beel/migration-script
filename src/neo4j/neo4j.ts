const neo4j = require("neo4j-driver");

require("dotenv").config();

const scheme = process.env.NEO4J_SCHEME;
const host = process.env.NEO4J_HOST;
const username = process.env.NEO4J_USERNAME;
const password = process.env.NEO4J_PASSWORD;
const database = process.env.NEO4J_DATABASE;

// Create a driver instance
const driver = neo4j.driver(
  `${scheme}://${host}`,
  neo4j.auth.basic(username, password),
  {
    database: database,
    disableLosslessIntegers: true
  }
);

// Export read and write functions
module.exports = {
  read: function (query: string, params: any) {
    const session = driver.session();
    return session
      .run(query, params)
      .then((result: any) => {
        const records = result.records.map((record: any) => {
          return record.toObject();
        });
        session.close();
        return records;
      })
      .catch((error: any) => {
        session.close();
        throw error;
      });
  },

  write: function (query: string, params: any) {
    const session = driver.session();
    return session
      .run(query, params)
      .then(() => {
        session.close();
        return true;
      })
      .catch((error: any) => {
        session.close();
        throw error;
      });
  },

  createOrUpdateUser: async function (user: string) {
    const query = `
      MERGE (u:User {account_name: $account_name})
      ON CREATE SET u += $properties, u.id = randomUUID(), u.created_at = timestamp()
      RETURN u
    `;

    const session = driver.session();

    return await session.run(query, {
      account_name: user,
      properties: {
        account_name: user,
        fcm_token: "",
        // rank: -4,
        // next_rank: -4,
        active_deposit: 0,
        max_payout: 0,
        div_paid: 0,
        remaining_div: 0,
        last_action: 0,
        last_deposited: 0,
      },
    });
  },

  createReferralRelation: async function (user: string, buddy: string) {
    const query = `
      MATCH (user:User {account_name: $userAccountName})
      MATCH (buddy:User {account_name: $buddyAccountName})
      MERGE (buddy)-[r:REFERRED]->(user)
      SET r.created_at = timestamp()
    `;

    const session = driver.session();

    return await session.run(query, {
      userAccountName: user,
      buddyAccountName: buddy,
    });
  },

  updateUser: async function (user: string, properties: any) {
    const query = `
      MATCH (u:User {account_name: $user})
      SET u += $properties
    `;

    const session = driver.session();

    return await session.run(query, {
      user,
      properties,
    });
  },
};
