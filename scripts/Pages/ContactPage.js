import React from 'react'
import InfoCard from '../Components/InfoCard'

class ContactPage extends React.Component {
  render () {
    return (
      <>
        <InfoCard title='Contact'>
          <p>If you have a:</p>
          <ul>
            <li>question about anything</li>
            <li>a feature request</li>
            <li>a bug to report</li>
            <li>a job to offer</li>
          </ul>
          <p>Or anything else really. You can contact me on <a href='mailto:remziatay47@gmail.com'>remziatay47@gmail.com</a>.
          This website is open source. All contributions are welcome on <a target='_blank' rel='noreferrer' href='https://github.com/remziatay/solverr'>github</a>!</p>
        </InfoCard>
      </>
    )
  }
}

export default ContactPage
