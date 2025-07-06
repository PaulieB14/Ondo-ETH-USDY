import {
  Transfer as TransferEvent,
  TransferShares as TransferSharesEvent,
  Approval as ApprovalEvent
} from "../generated/rUSDY/rUSDY"
import { 
  User, 
  Transfer, 
  TransferShares, 
  Approval 
} from "../generated/schema"
import { BigInt, Address } from "@graphprotocol/graph-ts"

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

function getOrCreateUser(address: Address): User {
  let user = User.load(address.toHex())
  if (user == null) {
    user = new User(address.toHex())
    user.address = address
    user.usdyBalance = BigInt.fromI32(0)
    user.rusdyBalance = BigInt.fromI32(0)
    user.rusdyShares = BigInt.fromI32(0)
    user.totalMinted = BigInt.fromI32(0)
    user.totalRedeemed = BigInt.fromI32(0)
    user.mintCount = BigInt.fromI32(0)
    user.redemptionCount = BigInt.fromI32(0)
    user.lastUpdated = BigInt.fromI32(0)
    user.save()
  }
  return user
}

export function handleRUSDYTransfer(event: TransferEvent): void {
  // Skip mint/burn transactions (from/to zero address)
  if (event.params.from.toHex() != ZERO_ADDRESS && event.params.to.toHex() != ZERO_ADDRESS) {
    // Update sender balance
    let fromUser = getOrCreateUser(event.params.from)
    fromUser.rusdyBalance = fromUser.rusdyBalance.minus(event.params.value)
    fromUser.lastUpdated = event.block.timestamp
    fromUser.save()
    
    // Update receiver balance
    let toUser = getOrCreateUser(event.params.to)
    toUser.rusdyBalance = toUser.rusdyBalance.plus(event.params.value)
    toUser.lastUpdated = event.block.timestamp
    toUser.save()
    
    // Create Transfer entity
    let transfer = new Transfer(
      event.transaction.hash.toHex() + "-" + event.logIndex.toString()
    )
    transfer.from = fromUser.id
    transfer.to = toUser.id
    transfer.amount = event.params.value
    transfer.token = "rUSDY"
    transfer.blockNumber = event.block.number
    transfer.blockTimestamp = event.block.timestamp
    transfer.transactionHash = event.transaction.hash
    transfer.save()
  }
}

export function handleTransferShares(event: TransferSharesEvent): void {
  // Skip mint/burn transactions (from/to zero address)
  if (event.params.from.toHex() != ZERO_ADDRESS && event.params.to.toHex() != ZERO_ADDRESS) {
    // Update sender shares
    let fromUser = getOrCreateUser(event.params.from)
    fromUser.rusdyShares = fromUser.rusdyShares.minus(event.params.sharesValue)
    fromUser.lastUpdated = event.block.timestamp
    fromUser.save()
    
    // Update receiver shares
    let toUser = getOrCreateUser(event.params.to)
    toUser.rusdyShares = toUser.rusdyShares.plus(event.params.sharesValue)
    toUser.lastUpdated = event.block.timestamp
    toUser.save()
    
    // Create TransferShares entity
    let transferShares = new TransferShares(
      event.transaction.hash.toHex() + "-" + event.logIndex.toString()
    )
    transferShares.from = event.params.from
    transferShares.to = event.params.to
    transferShares.sharesValue = event.params.sharesValue
    transferShares.blockNumber = event.block.number
    transferShares.blockTimestamp = event.block.timestamp
    transferShares.transactionHash = event.transaction.hash
    transferShares.save()
  }
}

export function handleRUSDYApproval(event: ApprovalEvent): void {
  let approval = new Approval(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  approval.owner = event.params.owner
  approval.spender = event.params.spender
  approval.value = event.params.value
  approval.token = "rUSDY"
  approval.blockNumber = event.block.number
  approval.blockTimestamp = event.block.timestamp
  approval.transactionHash = event.transaction.hash
  approval.save()
}
