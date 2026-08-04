pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Verify') {
            steps {
                sh 'pwd'
                sh 'ls -la'
                sh 'docker --version'
                sh 'kubectl version --client'
                sh 'git --version'
            }
        }
    }
}