- Все значения должны быть либо уникальными, либо null

```sql
create table STUDENTS
(
    ID          number constraint ST_ID_UNIQUE UNIQUE,
);

create table STUDENTS
(
    ID          number,
	NAME        varchar2(15),
    constraint ST_ID_UNIQUE UNIQUE (ID)
);
```

*Можно использовать сокращенный способ:*
```sql
create table STUDENTS
(
    ID          number,
    NAME        varchar2(15),
    UNIQUE (ID)
);
```

**Unique constraint** обеспечивается индексом. То есть при вставлении строк в таблицу oracle автоматически добавляет индекс, чтобы поиск по id происходил практически моментально. Но индекс не срабатывает с null значениями.