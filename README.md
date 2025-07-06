# Ondo USDY Subgraph

A comprehensive subgraph for indexing Ondo Finance's USDY (US Dollar Yield) and rUSDY (rebasing USDY) tokens on Ethereum mainnet.

## Overview

This subgraph tracks all major events and metrics for the Ondo USDY ecosystem, providing detailed analytics for:
- User balances and activity
- Mint and redemption operations
- Token transfers and approvals
- Price updates from the oracle
- Protocol-wide metrics and daily statistics

## Contracts Indexed

| Contract | Address | Description |
|----------|---------|-------------|
| USDY | `0x96F6eF951840721AdBF46Ac996b59E0235CB985C` | Main USDY token contract |
| rUSDY | `0xaf37c1167910ebC994e266949387d2c7C326b879` | Rebasing USDY token |
| USDYManager | `0x25A103A1D6AeC5967c1A4fe2039cdc514886b97e` | Handles mints and redemptions |
| Oracle | `0xA0219AA5B31e65Bc920B5b6DFb8EdF0988121De0` | Price oracle for USDY |

## Key Features

### 🔍 User Tracking
- Individual user balances for both USDY and rUSDY
- rUSDY shares tracking (for rebasing mechanics)
- Total minted and redeemed amounts per user
- Transaction counts and activity timestamps

### 💰 Transaction Monitoring
- All USDY and rUSDY transfers
- Mint requests and completions
- Redemption requests and completions
- Token approvals
- Share transfers (rUSDY specific)

### 📊 Protocol Analytics
- Real-time protocol metrics
- Daily aggregated statistics
- Price tracking from oracle
- Volume and user growth metrics

### 🏦 Yield Calculations
- Oracle price updates for yield tracking
- Interest rate ranges and overrides
- Historical price data for APY calculations

## GraphQL Schema

### Core Entities

#### User
```graphql
type User {
  id: ID!                           # User address
  address: Bytes!                   # User address
  usdyBalance: BigInt!              # Current USDY balance
  rusdyBalance: BigInt!             # Current rUSDY balance
  rusdyShares: BigInt!              # Current rUSDY shares
  totalMinted: BigInt!              # Total USDY minted
  totalRedeemed: BigInt!            # Total USDY redeemed
  mintCount: BigInt!                # Number of mint operations
  redemptionCount: BigInt!          # Number of redemption operations
  lastUpdated: BigInt!              # Last activity timestamp
  subscriptions: [MintRequested!]!  # All mint requests
  redemptions: [RedemptionRequested!]! # All redemption requests
  transfers: [Transfer!]!           # Outgoing transfers
  transfersReceived: [Transfer!]!   # Incoming transfers
}
```

#### Transfer
```graphql
type Transfer {
  id: ID!
  from: User!                       # Sender
  to: User!                         # Receiver
  amount: BigInt!                   # Transfer amount
  token: String!                    # "USDY" or "rUSDY"
  blockNumber: BigInt!
  blockTimestamp: BigInt!
  transactionHash: Bytes!
}
```

#### MintCompleted
```graphql
type MintCompleted {
  id: ID!
  user: User!                       # User who minted
  depositId: Bytes!                 # Unique deposit ID
  rwaAmountOut: BigInt!             # USDY tokens minted
  collateralAmountDeposited: BigInt! # USDC deposited
  price: BigInt!                    # Price at mint
  priceId: BigInt!                  # Oracle price ID
  blockNumber: BigInt!
  blockTimestamp: BigInt!
  transactionHash: Bytes!
}
```

#### ProtocolMetrics
```graphql
type ProtocolMetrics {
  id: ID!                           # "protocol"
  totalSupplyUSDY: BigInt!          # Total USDY supply
  totalSupplyRUSDY: BigInt!         # Total rUSDY supply
  totalUsers: BigInt!               # Total unique users
  totalMints: BigInt!               # Total mint operations
  totalRedemptions: BigInt!         # Total redemption operations
  totalVolumeUSD: BigInt!           # Total volume in USD
  currentPrice: BigInt!             # Current USDY price
  lastUpdated: BigInt!              # Last update timestamp
}
```

## Example Queries

### Get User Portfolio
```graphql
{
  users(where: {address: "0x..."}) {
    id
    usdyBalance
    rusdyBalance
    rusdyShares
    totalMinted
    totalRedeemed
    subscriptions(first: 10, orderBy: blockTimestamp, orderDirection: desc) {
      collateralAmountDeposited
      blockTimestamp
    }
  }
}
```

### Get Recent Transfers
```graphql
{
  transfers(first: 100, orderBy: blockTimestamp, orderDirection: desc) {
    from {
      id
    }
    to {
      id
    }
    amount
    token
    blockTimestamp
  }
}
```

### Get Protocol Metrics
```graphql
{
  protocolMetrics(id: "protocol") {
    totalSupplyUSDY
    totalSupplyRUSDY
    totalUsers
    totalMints
    totalRedemptions
    currentPrice
    totalVolumeUSD
  }
}
```

### Get Daily Statistics
```graphql
{
  dailyProtocolStats(
    first: 30
    orderBy: date
    orderDirection: desc
  ) {
    date
    totalMints
    totalRedemptions
    volumeUSD
    averagePrice
    uniqueUsers
  }
}
```

### Get Price History
```graphql
{
  priceUpdates(
    first: 100
    orderBy: timestamp
    orderDirection: desc
  ) {
    price
    timestamp
    priceId
  }
}
```

### Get Top Users by Volume
```graphql
{
  users(
    first: 10
    orderBy: totalMinted
    orderDirection: desc
  ) {
    id
    totalMinted
    totalRedeemed
    mintCount
    redemptionCount
  }
}
```

## Deployment

### Prerequisites
- Node.js 16+
- Graph CLI: `npm install -g @graphprotocol/graph-cli`

### Build and Deploy
```bash
# Install dependencies
yarn install

# Generate types
graph codegen

# Build subgraph
graph build

# Deploy to The Graph Network
graph deploy --product hosted-service your-github-username/ondo-usdy
```

## Development

### Local Development
```bash
# Start local Graph Node (requires Docker)
docker-compose up

# Deploy to local node
graph create --node http://localhost:8020/ ondo-usdy
graph deploy --node http://localhost:8020/ --ipfs http://localhost:5001 ondo-usdy
```

### Testing
```bash
# Run tests
graph test
```

## Key Metrics Tracked

### User Metrics
- ✅ Individual USDY/rUSDY balances
- ✅ Total minted/redeemed amounts
- ✅ Transaction counts and history
- ✅ rUSDY shares for rebasing calculations

### Protocol Metrics
- ✅ Total supply tracking
- ✅ User growth metrics
- ✅ Volume and transaction counts
- ✅ Price and yield data

### Financial Metrics
- ✅ Real-time price updates
- ✅ Historical price data for APY calculations
- ✅ Daily/weekly/monthly aggregations
- ✅ Volume and fee tracking

## Use Cases

This subgraph enables building:

1. **Portfolio Trackers** - Track individual user holdings and performance
2. **Analytics Dashboards** - Protocol-wide metrics and trends
3. **Yield Calculators** - Historical yield and APY calculations
4. **Trading Interfaces** - Real-time price and liquidity data
5. **Risk Management** - User activity and concentration metrics
6. **Compliance Tools** - Transaction history and audit trails



## Support

For questions or issues:
- Open an issue on GitHub
- Join the Ondo Finance Discord
- Check The Graph documentation

---

**Note**: This subgraph indexes data from Ethereum mainnet starting from block 17672244 (USDY deployment block).
