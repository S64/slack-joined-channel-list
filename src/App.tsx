import React, { useEffect, useReducer } from 'react';
import GitHubButton from 'react-github-btn'
import Slack from 'slack';
import './App.css';

type BaseState = {
  loading: boolean
  error: boolean,
  data?: any
}

const initialBaseState: BaseState = {
  loading: false,
  error: false,
  data: null
}

type BaseAction = {
  type: 'init' | 'start' | 'data' | 'error',
  data?: string[]
}

const baseReducer = (state: BaseState, action: BaseAction) => {
  switch (action.type) {
    case 'init':
      return initialBaseState
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

type ChannelsRequest = {
  token: string,
  userId: string,
}

const channelsReducer = baseReducer
const initialChannelsState = initialBaseState
type ChannelsAction = BaseAction

const useChannels = (req: ChannelsRequest | null) => {
  const [state, dispatch] = useReducer(channelsReducer, initialChannelsState)

  useEffect(
    () => {
      let dispatchSafe = (action: ChannelsAction) => { dispatch(action) }

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
        dispatchSafe = (_: ChannelsAction) => { /* no-op */ }
        dispatch({ type: 'init' })
      }
    },
    [ req ]
  )

  return state
}

type UsersRequest = {
  token: string
}

const usersReducer = baseReducer
const initialUsersState = initialBaseState
type UsersAction = BaseAction

const useUsers = (req: UsersRequest | null) => {
  const [state, dispatch] = useReducer(usersReducer, initialUsersState)

  useEffect(
    () => {
      let dispatchSafe = (action: UsersAction) => { dispatch(action) }

      (async () => {
        if (!req || !req.token) return;

        dispatchSafe({ type: 'start' })

        try {
          const res = await Slack.users.list({ token: req.token })
          if (res.ok) {
            dispatchSafe({
              type: 'data',
              data: (() => {
                return res['members']
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
        dispatchSafe = (_: UsersAction) => { /* no-op */ }
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
  const [usersReq, setUsersReq] = React.useState<UsersRequest | null>(null)
  const [req, setReq] = React.useState<ChannelsRequest | null>(null)

  const usersState = useUsers(usersReq)
  const channelsState = useChannels(req)

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
          <table>
            <tbody>
              <tr>
                <th>
                  <a href="https://api.slack.com/custom-integrations/legacy-tokens">Token</a>
                </th>
                <td>
                <input
                  type="text"
                  name="token"
                  value={ token }
                  onChange={ e => setToken(e.target.value) }
                  disabled={ usersState.loading || channelsState.loading }/>
                </td>
              </tr>
              <tr>
                <th>
                  <span>UesrId</span>
                  <button
                    disabled={ !token || usersState.loading || channelsState.loading }
                    onClick={ e => setUsersReq({ token: token }) }
                    >🔄</button>
                </th>
                <td>
                  <select
                    name="userId"
                    disabled={ !token || !usersState.data || usersState.loading || channelsState.loading }
                    onChange={ e => setUserId(e.target.value) }>
                      {(() => {
                        return (usersState.data || []).map((user: any) => {
                          return <option
                            value={user['id']}
                            selected={ user['id'] == userId }
                            >{ '`'+user['profile']['display_name']+'`: '+user['real_name']+' ('+user['id']+')' }</option>
                        })
                      })()}
                  </select>
                </td>
              </tr>
              <tr>
                <td colSpan={2}>
                <button
                  disabled={ !token || !userId || usersState.loading || channelsState.loading }
                  onClick={ e => setReq({ token: token, userId: userId }) }>Submit</button>
                </td>
              </tr>
            </tbody>
          </table>
        </form>
        {(() => {
          return channelsState.loading ? <div>Loading...</div> : <ul>
            {
              (channelsState.data || []).map((channelName: string) => {
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
