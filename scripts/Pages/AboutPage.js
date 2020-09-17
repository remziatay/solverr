import React from 'react'
import { Link } from 'react-router-dom'
import InfoCard from '../Components/InfoCard'

class AboutPage extends React.Component {
  render () {
    return (
      <>
        <InfoCard title='About'>
          <p>This website is initially built for personal needs to help my brother -who is in another country-
            to solve math and physics problems, questions. I thought this would be way more visual then trying
            to type solutions on whatsapp or telegram. Yet it can be handy for tutors or teachers all around
            the world as well. Especially during pandemic times.</p>

          <p>Connections are established directly between peers (thanks to <a href='https://peerjs.com/'>peerjs</a>).
          No data is sent or stored in any server beside establishing p2p connection on broker server. Disconnection
          problems indicates one of peers having poor connection.</p>

          <h3>How to use</h3>
          <p>
            Student must upload a picture of the question/problem. Tools can be selected on toolbox or right click
            (long touch on mobile) menu. Uploading another question will clear the board. Drawings can be made
            simultaneously by peers. But it is suggested to upload questions by aggreement.
          </p>
          <p>Mobile devices are supported but i recommend using it on computers due to small mobile screens.</p>

          <h3>What can be added</h3>
          <p>
            I have such new features in mind:
            <ul>
              <li>Voice communication</li>
              <li>Video communication</li>
              <li>Saving solution on the board to a file</li>
              <li>Processing images before sending such as cropping</li>
            </ul>
            <p>I'm in no hurry to add these features since i won't be using them. But you can always <Link to='/contact'>contact me</Link> for
            request. That will hurry me up <span role='img' aria-label='smiling'>🙂</span></p>
          </p>
        </InfoCard>
      </>
    )
  }
}

export default AboutPage
