import { NextRequest, NextResponse } from 'next/server'

const USERNAME_RE = /^[a-zA-Z0-9][a-zA-Z0-9_-]{2,29}$/

export async function POST(req: NextRequest) {
  try {
    const { walletAddress, username } = await req.json()
    if (!walletAddress || !username) {
      return NextResponse.json({ error: 'walletAddress and username required' }, { status: 400 })
    }

    const normalized = username.toLowerCase().trim()
    if (!USERNAME_RE.test(normalized)) {
      return NextResponse.json(
        { error: 'Username must be 3–30 chars, start with a letter or digit, use only a–z/0–9/_/-' },
        { status: 400 },
      )
    }

    // TODO: check uniqueness
    // const existing = await db.affiliate.findFirst({ where: { username: normalized } })
    // if (existing && existing.id !== walletAddress) {
    //   return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
    // }

    // TODO: persist
    // await db.affiliate.update({ where: { id: walletAddress }, data: { username: normalized } })

    return NextResponse.json({
      success: true,
      username: normalized,
      referralLink: `/@${normalized}`,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
