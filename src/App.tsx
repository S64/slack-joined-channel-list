import React, { useEffect, useReducer } from 'react';
import GitHubButton from 'react-github-btn'
import Slack from 'slack';
import './App.css';

type HogeState = {
  loading: boolean
  error: boolean,
  data?: any
}

const initialHogeState: HogeState = {
  loading: false,
  error: false,
  data: null
}

type HogeAction = {
  type: 'init' | 'start' | 'data' | 'error',
  data?: string[]
}

const hogeReducer = (state: HogeState, action: HogeAction) => {
  switch (action.type) {
    case 'init':
      return initialHogeState
    case 'start':
      return {...state, loading: true}
    case 'data':
      return {...state, loading: false, data: action.data, error: false}
    case 'error':
        return {...state, loading: false, data: null, error: true}
    default:
      throw new Error('TODO')
  }
}

type HogeRequest = {
  token: string,
  userId: string,
}

const useHoge = (req: HogeRequest | null) => {
  const [state, dispatch] = useReducer(hogeReducer, initialHogeState)

  useEffect(
    () => {
      let dispatchSafe = (action: HogeAction) => { dispatch(action) }

      (async () => {
        if (!req || !req.token) return;

        dispatchSafe({ type: 'start' })

        try {
          const res = await Slack.channels.list({ token: req.token })
          if (res.ok) {
            dispatchSafe({
              type: 'data',
              data: (() => {
                return res['channels']
                  .filter((elm: any) => elm['is_channel'])
                  .filter((elm: any) => elm['members'].includes( req.userId ))
                  .map((elm: any) => elm['name'])
              })()
            })
          } else {
            throw new Error('TODO')
          }
        } catch (e) {
          dispatchSafe({ type: 'error' })
        }

      })()

      return () => { // cleanup
        dispatchSafe = (_: HogeAction) => { /* no-op */ }
        dispatch({ type: 'init' })
      }
    },
    [ req ]
  )

  return state
}

const App: React.FC = () => {
  const [token, setToken] = React.useState('')
  const [userId, setUserId] = React.useState('')
  const [req, setReq] = React.useState<HogeRequest | null>(null)

  const hogeState = useHoge(req)

  return (
    <div className="App">
      <header className="App-header">
        <h1>
          <span>slack-joined-channel-list</span>
          <GitHubButton
            href="https://github.com/S64/slack-joined-channel-list"
            data-size="large"
            data-show-count="true"
            aria-label="Star S64/slack-joined-channel-list on GitHub">Star</GitHubButton>
        </h1>
      </header>
      <div className="App-body">
        <form onSubmit={ e => e.preventDefault() }>
          <label>
            <span>Token</span>
            <input
              type="text"
              name="token"
              value={ token }
              onChange={ e => setToken(e.target.value) }
              disabled={ hogeState.loading }
              />
          </label>
          <label>
            <span>UserID</span>
            <input
            type="text"
            name="userId"
            value={ userId }
            onChange={ e => setUserId(e.target.value) }
            disabled={ !token || hogeState.loading }
            />
          </label>
          <button
            disabled={ !token || !userId || hogeState.loading }
            onClick={ e => setReq({ token: token, userId: userId }) }>Submit</button>
        </form>
        {(() => {
          return hogeState.loading ? <div>Loading...</div> : <ul>
            {
              (hogeState.data || []).map((channelName: string) => {
                return <li>{channelName}</li>
              })
            }
          </ul>
        })()}
      </div>
    </div>
  );
}

export default App;
