pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        stage('Detect Changes') {
            steps {
                script {
                    def changedFiles = sh(
                        script: "git diff --name-only HEAD~1 HEAD",
                        returnStdout: true
                    ).trim()
    
                    echo "Changed Files:\n${changedFiles}"
    
                    env.FRONTEND_CHANGED = changedFiles.contains("frontend/") ? "true" : "false"
                    env.BACKEND_CHANGED = changedFiles.contains("backend/") ? "true" : "false"
                }
            }
        }
        stage('Build Frontend') {
            when {
                expression {
                    env.FRONTEND_CHANGED == "true"
                }
            }
            steps {
                sh '''
                docker build \
                -t akash0deep/studymate-frontend:${BUILD_NUMBER} \
                ./frontend
                '''
            }
        }
        stage('Build Backend') {
            when {
                expression {
                    env.BACKEND_CHANGED == "true"
                }
            }
            steps {
                sh '''
                docker build \
                -t akash0deep/studymate-backend:${BUILD_NUMBER} \
                ./backend
                '''
            }
        }
        stage('Push Images') {
            steps {

                sh '''
                docker push akash0deep/studymate-frontend:${BUILD_NUMBER}
                docker push akash0deep/studymate-backend:${BUILD_NUMBER}
                '''
            }
        }
        stage('Deploy') {
            steps {

                sh '''
                kubectl set image deployment/frontend \
                frontend=akash0deep/studymate-frontend:${BUILD_NUMBER}

                kubectl set image deployment/backend \
                backend=akash0deep/studymate-backend:${BUILD_NUMBER}
                '''
            }
        }
        stage('Verify') {

            steps {

                sh '''
                kubectl rollout status deployment/frontend
                kubectl rollout status deployment/backend
                '''
            }
        }    
    }
}