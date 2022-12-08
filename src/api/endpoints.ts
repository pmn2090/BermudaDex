import axios from 'axios';

const ORDERBOOK_API_URL = process.env.NEXT_PUBLIC_ORDERBOOK_API_URL || "invalid orderbook api url";

export type CreateOrderParams = {
    baseToken: string,
    quoteToken: string,
    baseAmount: string,
    quoteAmountThreshold: string,
    direction: string,
    receiver: string,
    signature: string
}

export type Order = {
    id: string,
    orderid: string,
    baseToken: string,
    quoteToken: string,
    baseAmount: string,
    quoteAmountThreshold: string,
    direction: string,
    receiverPubkey: string,
    signature: string,
    availableBalance: string,
    batchid: string,
    orderState: string,
    updatedAt: string,
    createdAt: string
}


export async function addNewOrder(order: CreateOrderParams) {
    try {
        const { data } = await axios.post<Order>(
                ORDERBOOK_API_URL+'/newOrder',
                order,
            {
                headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                },
            },
        )
        console.log(JSON.stringify(data, null, 4))
        return data
    } catch (error) {
        if(error instanceof Error) {
            console.log('error message: ', error.message)
            console.log(error.name)
            return error.message
        } else {
            console.log('unexpected error: ', error)
            return 'An unexpected error occured'
        }
    }
}

export async function getQuote(baseToken: string, quoteToken: string, amount: number): Promise<Quote>{
    try {
        const { data, status } = await axios.get<Quote>(
            ORDERBOOK_API_URL+'/quote?baseToken='+baseToken+'&quoteToken='+quoteToken+'&amt='+amount.toString(),
            {
                headers: {
                    Accept: 'application/json',
                },
            },
        )
    
        console.log(JSON.stringify(data, null, 4))
        return data
    } catch (error) {
        if (error instanceof Error) {
            console.log('error message: ', error.message)
            throw new Error('error loading quote')
        } else {
            console.log('unexpected error: ', error)
            throw new Error('error loading quote')
        }
    }
}

export async function getLatestOrders(walletPubkey: string): Promise<Order[]> {
    try {
        const { data, status } = await axios.get<Order[]>(
            ORDERBOOK_API_URL+'/getLatestOrders?wallet='+walletPubkey+'&limit=5',
            {
                headers: {
                    Accept: 'application/json',
                },
            },
        )
    
        console.log(JSON.stringify(data, null, 4))
        return data
    } catch (error) {
        if (error instanceof Error) {
            console.log('error message: ', error.message)
            throw new Error('error loading quote')
        } else {
            console.log('unexpected error: ', error)
            throw new Error('error loading quote')
        }
    }
}

type Quote = {
    quoteAmount: number,
    quoteRate: number
}