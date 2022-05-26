pipeline {
    agent any
    stages {
        stage('Run Tests') {
            parallel {
                stage('Test On Mac') {
                    parallel {
                        stage('Test Meetings') {
                            environment {
                                KEYCHAIN_PASSKEY = credentials('amzn-macos-n1-keychain-password')
                                }
                            agent {
                                label "amzn-macos-n1"
                            }
                            steps {
                                sh "chmod 755 scripts/run-tests-mac-meetings.sh"
                                sh "ls -la"
                                sh "rm -rf ~/QA/Meeting/HelloWorld.xcarchive"
                                sh "sudo security lock-keychain ~/Library/Keychains/login.keychain-db"
                                sh "sudo security unlock-keychain -p ${KEYCHAIN_PASSKEY} ~/Library/Keychains/login.keychain-db"
                                sh "scripts/run-tests-mac-meetings.sh"
                            }
                        }
                        stage('Live Stream Meetings') {
                            environment {
                                KEYCHAIN_PASSKEY = credentials('amzn-macos-n1-keychain-password')
                                }
                            agent {
                                label "amzn-macos-n1"
                            }
                            steps {
                                sh "chmod 755 scripts/run-tests-live-stream.sh"
                                sh "ls -la"
                                sh "rm -rf ~/QA/LiveStreaming/HelloWorld.xcarchive"
                                sh "sudo security lock-keychain ~/Library/Keychains/login.keychain-db"
                                sh "sudo security unlock-keychain -p ${KEYCHAIN_PASSKEY} ~/Library/Keychains/login.keychain-db"
                                sh "scripts/run-tests-mac-live-stream.sh"
                            }
                        }
                    }
                }
                stage('Test On Linux') {
                    agent {
                        label "amzn-linux2-n4-ubuntu"
                    }
                    steps {
                        sh "chmod 755 scripts/run-tests-lnx.sh"
	                    sh "ls -la"
                        sh "scripts/run-tests-lnx.sh"
                    }
                }
            }
        }
    }

    post {
        always {
            echo 'cleaning up our workspace'
            deleteDir()
        }
    }

}
