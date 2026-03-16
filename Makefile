run:
		cd app && npx expo start

server:
	    fish -c "source venv/bin/activate.fish; cd api; python manage.py runserver"

redis:
		redis-server
