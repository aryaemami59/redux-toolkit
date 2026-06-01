import type { NextPage } from 'next'
import { Counter } from '../features/counter/Counter'
import { Post } from '../features/posts/Post'
import { TimeDisplay } from '../features/time/TimeList'

const IndexPage: NextPage = () => {
  return (
    <div className="App">
      <header className="App-header">
        <Counter />
        <TimeDisplay
          label="(GMT -5:00) Eastern Time (US & Canada), Bogota, Lima"
          offset="-5:00"
        />
        <Post id={1} />
      </header>
    </div>
  )
}

export default IndexPage
