
# Object SYNONYM
*необходимо знать:* [[Объекты Баз Данных]]
*теги:* #sql 
*описание:* 

---

Полное обращение к таблице:
```sql
select * from hr.EMPLOYEES@orclpdb2;
```
hr - пользователь
employees - таблица
orclpdb2 - база данных

Теперь мы можем дать синоним на это обращение для всех user-ов, у которых есть права на работу с этой таблицей.

## Типы синонимов
Если создать private и public синонимы с одним и тем же именем, то будет выводиться private синоним. 

### Public
Эти синонимы не являются объектами определенной схемы, то есть они не находятся в том же пространтсве имен, что и таблицы или view. 

Эти синонимы находсятся вне схемы и для их использования достаточно написать сам синоним.

**Создание синонима:**
>CREATE PUBLIC SYNONYM synonym_name
>FOR object_name;


### Private
Эти синонимы являются объектами определенной схемы.
Для обращения к таким синонимам нужно использовать имя схемы. `schemaName.synonym`

**Создание:**
>CREATE SYNONYM synonym_name
>FOR object_name;


## Создание и удаление синонимов
### Получение прав
**Чтобы создать такой синоним, вам нужно будет получить на это права:**

Подключиться как администратор:
```bash
sqlplus sys/password@database_name as sysdba
```

Выдача прав на создание и удаление синоинмов:
```sql
grant create public synonym to hr;
grant drop public synonym to hr;

```

### Создание/удаление/изменение

**Создание:**
```sql
create synonym syn1 for STUDENTS;
select * from syn1;
delete from syn1 where id = 7;

create public synonym syn2 for EMPLOYEES;
select * from syn2;
create synonym syn2 for STUDENTS;
```

**Удаление:**

>DROP PUBLIC SYNONYM synonym_name; -- для удаление public
DROP SYNONYM synonym_name; -- для удаление private


**Перекомпиляция:**
>ALTER PUBLIC SYNONYM synonym_name 
COMPILE;