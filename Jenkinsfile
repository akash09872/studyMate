pipeline {
    agent any

    environment {
        DOCKERHUB_USER = "akash0deep"
    }

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
                        script: '''
                            if git rev-parse HEAD~1 >/dev/null 2>&1; then
                                git diff --name-only HEAD~1 HEAD
                            else
                                git ls-files
                            fi
                        ''',
                        returnStdout: true
                    ).trim()

                    echo "Changed Files:\n${changedFiles}"

                    env.FRONTEND_CHANGED = changedFiles.contains("frontend/") ? "true" : "false"
                    env.BACKEND_CHANGED  = changedFiles.contains("backend/") ? "true" : "false"

                    echo "Frontend Changed: ${env.FRONTEND_CHANGED}"
                    echo "Backend Changed : ${env.BACKEND_CHANGED}"
                }
            }
        }

        stage('Build Frontend') {
            when {
                expression { env.FRONTEND_CHANGED == "true" }
            }

            steps {
                sh """
                docker build \
                -t ${DOCKERHUB_USER}/studymate-frontend:${BUILD_NUMBER} \
                ./frontend
                """
            }
        }

        stage('Build Backend') {
            when {
                expression { env.BACKEND_CHANGED == "true" }
            }

            steps {
                sh """
                docker build \
                -t ${DOCKERHUB_USER}/studymate-backend:${BUILD_NUMBER} \
                ./backend
                """
            }
        }

        stage('Push Frontend') {
            when {
                expression { env.FRONTEND_CHANGED == "true" }
            }

            steps {
                sh """
                docker push ${DOCKERHUB_USER}/studymate-frontend:${BUILD_NUMBER}
                """
            }
        }

        stage('Push Backend') {
            when {
                expression { env.BACKEND_CHANGED == "true" }
            }

            steps {
                sh """
                docker push ${DOCKERHUB_USER}/studymate-backend:${BUILD_NUMBER}
                """
            }
        }

        stage('Deploy') {
            steps {
                script {

                    if (env.FRONTEND_CHANGED == "true") {
                        sh """
                        kubectl set image deployment/frontend \
                        frontend=${DOCKERHUB_USER}/studymate-frontend:${BUILD_NUMBER}
                        """
                    }

                    if (env.BACKEND_CHANGED == "true") {
                        sh """
                        kubectl set image deployment/backend \
                        backend=${DOCKERHUB_USER}/studymate-backend:${BUILD_NUMBER}
                        """
                    }

                }
            }
        }

        stage('Verify Rollout') {
            steps {
                script {

                    if (env.FRONTEND_CHANGED == "true") {
                        sh "kubectl rollout status deployment/frontend"
                    }

                    if (env.BACKEND_CHANGED == "true") {
                        sh "kubectl rollout status deployment/backend"
                    }

                }
            }
        }
    }

    post {

        failure {

            script {

                if (env.FRONTEND_CHANGED == "true") {
                    sh "kubectl rollout undo deployment/frontend"
                }

                if (env.BACKEND_CHANGED == "true") {
                    sh "kubectl rollout undo deployment/backend"
                }

            }
        }

        success {
            echo "Pipeline completed successfully."
        }
    }
}